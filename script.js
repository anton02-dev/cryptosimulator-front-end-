let balance = 0;
let btcAmount = 0;

let currentPrice = 40000;
let priceHistory = [];
let buyPoints = [];
let sellPoints = [];
let chart;


window.addEventListener('message', (event) => {
    if (event.data.type === 'priceUpdate') {
        currentPrice = event.data.currentPrice;
        priceHistory = event.data.priceHistory;
        updateChart();
        updateUI();
    }
});


function updateUI() {
    document.getElementById('balance').textContent = balance.toFixed(2);
    document.getElementById('btc-amount').textContent = btcAmount.toFixed(8);
    document.getElementById('current-price').textContent = currentPrice.toFixed(2);
    document.getElementById('current-price-sell').textContent = currentPrice.toFixed(2);
}

function updateChart() {
    chart.data.datasets[0].data = priceHistory;
    chart.data.datasets[1].data = buyPoints;
    chart.data.datasets[2].data = sellPoints;
    chart.update();
}

function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(50).fill(''),
            datasets: [
                {
                    label: 'BTC Price',
                    data: priceHistory,
                    borderColor: '#4CAF50',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Buy Points',
                    data: buyPoints,
                    backgroundColor: '#4CAF50',
                    borderColor: '#4CAF50',
                    pointRadius: 8,
                    pointStyle: 'triangle',
                    showLine: false
                },
                {
                    label: 'Sell Points',
                    data: sellPoints,
                    backgroundColor: '#f44336',
                    borderColor: '#f44336',
                    pointRadius: 8,
                    pointStyle: 'triangle',
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#404040'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                x: {
                    grid: {
                        color: '#404040'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

function executeBuy() {
    const amountUSD = parseFloat(document.getElementById('buy-amount').value);
    if (isNaN(amountUSD) || amountUSD <= 0) {
        return;
    }
    if (amountUSD > balance) {
        return;
    }

    const btcPurchased = amountUSD / currentPrice;
    balance -= amountUSD;
    btcAmount += btcPurchased;
    

    buyPoints.push({
        x: priceHistory.length - 1,
        y: currentPrice
    });
    
    updateUI();
    updateChart();
    document.getElementById('buy-amount').value = '';
    $.post('http://crypto/buyBtc', JSON.stringify({btcAmount, balance}));
}
function executeSell() {
    const amountBTC = parseFloat(document.getElementById('sell-amount').value);

    if (isNaN(amountBTC) || amountBTC <= 0) {
        return;
    }
    if (amountBTC > btcAmount) {
        return;
    }

    const usdReceived = amountBTC * currentPrice;

    balance = parseFloat((balance + usdReceived).toFixed(0)); 
    btcAmount = parseFloat((btcAmount - amountBTC).toFixed(8));

    sellPoints.push({
        x: priceHistory.length - 1,
        y: currentPrice
    });

    updateUI();
    updateChart();
    document.getElementById('sell-amount').value = '';
    $.post('http://crypto/sellBtc', JSON.stringify({btcAmount, balance}));
}


function updatePrice() {
    const changePercent = (Math.random() - 0.5) * 2;
    const priceChange = currentPrice * (changePercent / 100);
    currentPrice += priceChange;
    
    priceHistory.push(currentPrice);
    if (priceHistory.length > 50) {
        priceHistory.shift();

        buyPoints = buyPoints.map(point => ({
            x: point.x - 1,
            y: point.y
        })).filter(point => point.x >= 0);
        
        sellPoints = sellPoints.map(point => ({
            x: point.x - 1,
            y: point.y
        })).filter(point => point.x >= 0);
    }
    
    updateChart();
    updateUI();
}


for (let i = 0; i < 50; i++) {
    priceHistory.push(currentPrice);
}
initChart();
updateUI();


setInterval(updatePrice, 2000);

const addBalanceAmount = document.getElementById("input");
async function addBalance() {
    let amount = parseFloat(addBalanceAmount.value);
    const response = await fetch('http://crypto/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount
        })
    });
    addBalanceAmount.value = '';  
}

async function withdraw() {
    const withdrawButton = document.getElementById('withdraw'); 
    try {
        withdrawButton.disabled = true; 
        
        const response = await fetch('http://crypto/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                balance: balance
            })
        });

        if (response.ok) {
            balance = 0;
            updateUI();
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        withdrawButton.disabled = false; 
    }
}


window.addEventListener("message", (event) => {
    if (event.data.type === "getMoneyResponse") {
        const succes = event.data.succes;
        const amount = event.data.amount;
        if (succes) {
            balance = balance + amount;
            updateUI();
        }
    }
});


$(function () {
    function display(bool) {
        if (bool) {
            $(".container").css("display", "block");
        } else {
            $(".container").css("display", "none");
        }
    }

    display(false)

    window.addEventListener('message', function(event) {
        var item = event.data;
        if (item.type === "ui") {
            if (item.status) {
                display(true);
            } else {
                display(false);
            }
        }
    });

    document.onkeyup = function (data) {
        if (data.which == 27) {
            $.post('http://crypto/exit', JSON.stringify({}));
            return
        }
    };
})

window.addEventListener("message", (event) => {
    const data = event.data;

    if (data.action === "updateBalance") {
        balance = data.balance;
        updateUI();
    }
});

window.addEventListener("message", (event) => {
    const data = event.data;

    if (data.action === "updateBtc") {
        btcAmount = data.btc;
        updateUI();
    }
});

