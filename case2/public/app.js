import { formatMoney, formatMinutes, summarizeBatch } from '/src/parking-client.js';

const state = {
  config: null,
  tickets: [],
};

function vehicleLabel(type) {
  return type === 'large' ? '大型车' : '小型车';
}

async function readJson(url, options) {
  const res = await fetch(url, options);
  return res.json();
}

function renderConfig() {
  const box = document.getElementById('config');
  if (!state.config) {
    box.textContent = '正在加载演示配置...';
    return;
  }
  box.innerHTML = `
    <strong>${state.config.lotName}</strong>
    <span class="meta">演示结算时间：${state.config.demoAsOfLabel}</span>
    <span class="meta">当前场内车辆：${state.config.activeCount} / ${state.config.capacity}</span>
  `;
}

function renderTickets() {
  const ul = document.getElementById('ticket-items');
  ul.innerHTML = '';

  if (state.tickets.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '当前没有待出场车辆。';
    ul.appendChild(li);
    return;
  }

  for (const ticket of state.tickets) {
    const li = document.createElement('li');
    li.className = 'ticket-item';
    li.innerHTML = `
      <div>
        <div class="plate">${ticket.plateNo}</div>
        <div class="meta">
          <span>${vehicleLabel(ticket.vehicleType)}</span>
          <span>已停 ${formatMinutes(ticket.stayMinutes)}</span>
          <span>入场 ${ticket.entryAtLabel}</span>
          ${ticket.isMember ? '<span class="tag">会员</span>' : ''}
        </div>
      </div>
      <div>
        <div class="amount">${formatMoney(ticket.previewFeeCents)}</div>
        <div class="meta">按演示时间点预计收费</div>
      </div>
      <div>
        <button data-ticket-id="${ticket.ticketId}" data-testid="checkout-${ticket.ticketId}">出场结算</button>
      </div>
    `;
    li.querySelector('button').addEventListener('click', () => checkoutTicket(ticket.ticketId));
    ul.appendChild(li);
  }
}

async function loadData() {
  const [config, tickets] = await Promise.all([
    readJson('/api/config'),
    readJson('/api/tickets'),
  ]);
  state.config = config;
  state.tickets = tickets;
  renderConfig();
  renderTickets();
}

async function checkoutTicket(ticketId) {
  const box = document.getElementById('result');
  const data = await readJson('/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ticketId, exitAt: state.config.demoAsOf }),
  });

  if (data.ok) {
    box.className = 'result ok';
    box.textContent = `车辆 ${data.plateNo} 已出场，停车 ${formatMinutes(data.stayMinutes)}，实收 ${formatMoney(data.finalCents)}。`;
    await loadData();
    return;
  }

  box.className = 'result err';
  box.textContent = `结算失败：${data.message || data.code}`;
}

async function estimatePeak() {
  const count = Math.max(10, Math.min(5000, Number(document.getElementById('batch-count').value) || 500));
  const box = document.getElementById('batch-result');
  box.className = 'result neutral';
  box.textContent = '正在估算，请稍候...';

  const data = await readJson('/api/peak-estimate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count, exitAt: state.config.demoAsOf }),
  });

  if (data.ok) {
    box.className = 'result ok';
    box.textContent = summarizeBatch(data);
    return;
  }

  box.className = 'result err';
  box.textContent = `估算失败：${data.message || data.code}`;
}

document.getElementById('estimate').addEventListener('click', estimatePeak);
loadData();
