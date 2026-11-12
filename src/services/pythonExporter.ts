import { LSTMHyperparameters } from '../types/market';

export function generateStreamlitScript(symbol: string, hyperparams: LSTMHyperparameters): string {
  return `"""
=================================================================================
 NeuralStock LSTM: Stock Market Analytics & Price Prediction
 Interactive Streamlit Dashboard with Plotly & Long Short-Term Memory Network
=================================================================================
Install dependencies:
    pip install streamlit plotly pandas numpy yfinance torch scikit-learn
Run application:
    streamlit run app_streamlit.py
"""

import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sklearn.preprocessing import MinMaxScaler
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta

# Page Configuration
st.set_page_config(
    page_title="NeuralStock LSTM | AI Price Forecasting",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #0e1117;
        border: 1px solid #262730;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
st.sidebar.title("NeuralStock LSTM Engine")
selected_ticker = st.sidebar.selectbox("Select Asset", ["${symbol}", "NVDA", "AAPL", "TSLA", "MSFT", "GOOGL", "SPY", "BTC-USD"], index=0)
timeframe = st.sidebar.selectbox("Historical Timeframe", ["1mo", "3mo", "6mo", "1y", "2y", "5y"], index=3)

st.sidebar.markdown("---")
st.sidebar.subheader("LSTM Model Hyperparameters")
lookback_days = st.sidebar.slider("Lookback Window (Days)", 10, 90, ${hyperparams.lookbackDays})
forecast_days = st.sidebar.slider("Forecast Horizon (Days)", 3, 30, ${hyperparams.forecastDays})
hidden_units = st.sidebar.select_slider("LSTM Hidden Units", options=[16, 32, 64, 128], value=${hyperparams.hiddenUnits})
num_layers = st.sidebar.slider("LSTM Layers", 1, 3, ${hyperparams.numLayers})
epochs = st.sidebar.slider("Training Epochs", 5, 100, ${hyperparams.epochs})
learning_rate = st.sidebar.number_input("Learning Rate", value=${hyperparams.learningRate}, format="%.4f")

st.sidebar.markdown("---")
st.sidebar.subheader("Technical Indicators")
show_sma = st.sidebar.checkbox("SMA (20 & 50)", value=True)
show_ema = st.sidebar.checkbox("EMA (20)", value=True)
show_bb = st.sidebar.checkbox("Bollinger Bands (20, 2)", value=False)
show_rsi = st.sidebar.checkbox("RSI (14)", value=True)
show_macd = st.sidebar.checkbox("MACD (12, 26, 9)", value=True)

# ---------------------------------------------------------
# PyTorch LSTM Architecture
# ---------------------------------------------------------
class StockLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1, dropout=0.2):
        super(StockLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

class TimeSeriesDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# ---------------------------------------------------------
# Data Fetching & Processing
# ---------------------------------------------------------
@st.cache_data(ttl=300)
def load_market_data(ticker, period):
    df = yf.download(ticker, period=period, interval="1d", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.dropna(inplace=True)
    return df

df = load_market_data(selected_ticker, timeframe)

if df.empty:
    st.error("Could not retrieve market data. Please verify ticker symbol.")
    st.stop()

current_price = float(df['Close'].iloc[-1])
prev_price = float(df['Close'].iloc[-2]) if len(df) > 1 else current_price
price_diff = current_price - prev_price
pct_diff = (price_diff / prev_price) * 100

st.title(f"{selected_ticker} Analysis & LSTM Price Prediction")
st.caption(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} · Data source: Yahoo Finance / NeuralEngine")

kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("Current Price", f"\${current_price:,.2f}", f"{price_diff:+.2f} ({pct_diff:+.2f}%)")
kpi2.metric("24h High", f"\${float(df['High'].iloc[-1]):,.2f}")
kpi3.metric("24h Low", f"\${float(df['Low'].iloc[-1]):,.2f}")
kpi4.metric("24h Volume", f"{int(df['Volume'].iloc[-1]):,}")

# ---------------------------------------------------------
# Indicator Calculations
# ---------------------------------------------------------
df['SMA20'] = df['Close'].rolling(window=20).mean()
df['SMA50'] = df['Close'].rolling(window=50).mean()
df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()

# Bollinger Bands
df['BB_Mid'] = df['Close'].rolling(window=20).mean()
df['BB_Std'] = df['Close'].rolling(window=20).std()
df['BB_Upper'] = df['BB_Mid'] + 2 * df['BB_Std']
df['BB_Lower'] = df['BB_Mid'] - 2 * df['BB_Std']

# RSI
delta = df['Close'].diff()
gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
rs = gain / (loss + 1e-9)
df['RSI'] = 100 - (100 / (1 + rs))

# MACD
exp1 = df['Close'].ewm(span=12, adjust=False).mean()
exp2 = df['Close'].ewm(span=26, adjust=False).mean()
df['MACD'] = exp1 - exp2
df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

# ---------------------------------------------------------
# LSTM Training Pipeline
# ---------------------------------------------------------
st.markdown("### 🧠 Train LSTM Recurrent Model")

if st.button("Run LSTM Training & Price Prediction", type="primary"):
    with st.spinner("Preparing sequences and training LSTM neural network..."):
        closes = df['Close'].values.reshape(-1, 1)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(closes)

        # Create lookback sequences
        X_data, y_data = [], []
        for i in range(lookback_days, len(scaled_data)):
            X_data.append(scaled_data[i-lookback_days:i])
            y_data.append(scaled_data[i])

        X_arr = np.array(X_data)
        y_arr = np.array(y_data)

        train_size = int(len(X_arr) * 0.8)
        X_train, y_train = X_arr[:train_size], y_arr[:train_size]
        X_test, y_test = X_arr[train_size:], y_arr[train_size:]

        train_dataset = TimeSeriesDataset(X_train, y_train)
        train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

        model = StockLSTM(input_size=1, hidden_size=hidden_units, num_layers=num_layers, output_size=1)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

        # Train loop
        epoch_losses = []
        progress_bar = st.progress(0)
        for ep in range(epochs):
            model.train()
            ep_loss = 0.0
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                pred = model(batch_x)
                loss = criterion(pred, batch_y)
                loss.backward()
                optimizer.step()
                ep_loss += loss.item()
            avg_loss = ep_loss / len(train_loader)
            epoch_losses.append(avg_loss)
            progress_bar.progress((ep + 1) / epochs)

        # Evaluate on Test Set
        model.eval()
        with torch.no_grad():
            test_x_tensor = torch.tensor(X_test, dtype=torch.float32)
            preds_scaled = model(test_x_tensor).numpy()
            y_test_scaled = y_test

        preds_actual = scaler.inverse_transform(preds_scaled)
        y_test_actual = scaler.inverse_transform(y_test_scaled)

        rmse = np.sqrt(np.mean((preds_actual - y_test_actual) ** 2))
        mae = np.mean(np.abs(preds_actual - y_test_actual))
        mape = np.mean(np.abs((preds_actual - y_test_actual) / y_test_actual)) * 100
        
        # Directional accuracy
        actual_dirs = np.diff(y_test_actual.flatten()) > 0
        pred_dirs = np.diff(preds_actual.flatten()) > 0
        dir_acc = np.mean(actual_dirs == pred_dirs) * 100

        # Multi-Step Future Rollout
        last_seq = scaled_data[-lookback_days:].copy()
        future_preds_scaled = []
        for _ in range(forecast_days):
            seq_t = torch.tensor(last_seq.reshape(1, lookback_days, 1), dtype=torch.float32)
            with torch.no_grad():
                next_val = model(seq_t).item()
            future_preds_scaled.append(next_val)
            last_seq = np.append(last_seq[1:], [[next_val]], axis=0)

        future_preds = scaler.inverse_transform(np.array(future_preds_scaled).reshape(-1, 1)).flatten()
        last_date = df.index[-1]
        future_dates = [last_date + timedelta(days=i) for i in range(1, forecast_days + 1)]

        # Display Metrics
        st.success("LSTM Model Trained & Forecast Generated Successfully!")
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("RMSE", f"\${rmse:.2f}")
        m2.metric("MAE", f"\${mae:.2f}")
        m3.metric("MAPE", f"{mape:.2f}%")
        m4.metric("Directional Accuracy", f"{dir_acc:.1f}%")

        # Plot Loss Curve
        fig_loss = go.Figure()
        fig_loss.add_trace(go.Scatter(y=epoch_losses, mode='lines+markers', name='Train Loss (MSE)', line=dict(color='#3b82f6', width=2)))
        fig_loss.update_layout(title="Epoch Training Loss Convergence", xaxis_title="Epoch", yaxis_title="MSE Loss", height=300, template="plotly_dark")
        st.plotly_chart(fig_loss, use_container_width=True)

        # Plot Forecast
        fig_pred = go.Figure()
        fig_pred.add_trace(go.Scatter(x=df.index[-60:], y=df['Close'].iloc[-60:], mode='lines', name='Actual Price (Historical)', line=dict(color='#e2e8f0', width=2)))
        fig_pred.add_trace(go.Scatter(x=future_dates, y=future_preds, mode='lines+markers', name=f'LSTM Forecast ({forecast_days}d)', line=dict(color='#10b981', width=3, dash='dash')))
        
        # Confidence interval band
        ci_lower = future_preds - 1.96 * rmse * np.sqrt(np.arange(1, forecast_days + 1)) * 0.3
        ci_upper = future_preds + 1.96 * rmse * np.sqrt(np.arange(1, forecast_days + 1)) * 0.3
        fig_pred.add_trace(go.Scatter(x=future_dates + future_dates[::-1], y=np.concatenate([ci_upper, ci_lower[::-1]]), fill='toself', fillcolor='rgba(16, 185, 129, 0.15)', line=dict(color='rgba(255,255,255,0)'), name='95% Confidence Interval'))
        
        fig_pred.update_layout(title=f"{selected_ticker} LSTM Future Price Trajectory", xaxis_title="Date", yaxis_title="Price ($)", height=450, template="plotly_dark")
        st.plotly_chart(fig_pred, use_container_width=True)

# ---------------------------------------------------------
# Interactive Main Chart
# ---------------------------------------------------------
st.markdown("### 📊 Interactive Technical Analysis")

rows = 1
row_heights = [0.7]
if show_rsi or show_macd:
    rows += 1
    row_heights = [0.7, 0.3]

fig = make_subplots(rows=rows, cols=1, shared_xaxes=True, vertical_spacing=0.04, row_heights=row_heights)

# Candlestick
fig.add_trace(go.Candlestick(
    x=df.index,
    open=df['Open'],
    high=df['High'],
    low=df['Low'],
    close=df['Close'],
    name='OHLC'
), row=1, col=1)

# Overlays
if show_sma:
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], line=dict(color='#f59e0b', width=1.5), name='SMA 20'), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA50'], line=dict(color='#3b82f6', width=1.5), name='SMA 50'), row=1, col=1)

if show_ema:
    fig.add_trace(go.Scatter(x=df.index, y=df['EMA20'], line=dict(color='#8b5cf6', width=1.5), name='EMA 20'), row=1, col=1)

if show_bb:
    fig.add_trace(go.Scatter(x=df.index, y=df['BB_Upper'], line=dict(color='rgba(148, 163, 184, 0.5)', width=1), name='BB Upper'), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['BB_Lower'], line=dict(color='rgba(148, 163, 184, 0.5)', width=1), fill='tonexty', fillcolor='rgba(148, 163, 184, 0.08)', name='BB Lower'), row=1, col=1)

if rows > 1 and show_rsi:
    fig.add_trace(go.Scatter(x=df.index, y=df['RSI'], line=dict(color='#ec4899', width=1.5), name='RSI 14'), row=2, col=1)
    fig.add_hline(y=70, line_dash="dash", line_color="#ef4444", row=2, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="#10b981", row=2, col=1)

fig.update_layout(
    height=600,
    xaxis_rangeslider_visible=False,
    template="plotly_dark",
    margin=dict(l=20, r=20, t=30, b=20)
)
st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------
# Automated Email & Push Alert Simulation
# ---------------------------------------------------------
st.markdown("### 🔔 Automated Market Movement Alerts")
with st.expander("Configure Price & Indicator Alerts"):
    alert_type = st.selectbox("Trigger Rule", ["Price Crosses Above", "Price Crosses Below", "Percent Surge > X%", "RSI Overbought (>70)", "RSI Oversold (<30)"])
    target_threshold = st.number_input("Threshold Value", value=float(current_price * 1.05))
    target_email = st.text_input("Destination Email", "rameshpiriththi@gmail.com")
    
    if st.button("Activate Real-Time Alert Rule"):
        st.success(f"Rule configured: Alert will notify {target_email} when {selected_ticker} triggers '{alert_type}' at threshold {target_threshold}.")
`;
}

export function generatePyTorchScript(symbol: string): string {
  return `"""
PyTorch LSTM Deep Learning Pipeline for Financial Time Series
Author: NeuralStock Architecture
"""

import numpy as np
import pandas as pd
import yfinance as yf
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt

# 1. Dataset Class
class StockDataset(Dataset):
    def __init__(self, sequences, targets):
        self.sequences = torch.tensor(sequences, dtype=torch.float32)
        self.targets = torch.tensor(targets, dtype=torch.float32)

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

# 2. LSTM Architecture
class LSTMStockPredictor(nn.Module):
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=2, output_dim=1, dropout=0.2):
        super(LSTMStockPredictor, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

# 3. Main Training Execution
def train_and_evaluate(symbol="${symbol}", lookback=30, epochs=50, lr=0.002):
    print(f"Downloading historical data for {symbol}...")
    df = yf.download(symbol, period="2y", interval="1d")
    closes = df['Close'].values.reshape(-1, 1)

    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(closes)

    X, y = [], []
    for i in range(lookback, len(scaled_data)):
        X.append(scaled_data[i-lookback:i])
        y.append(scaled_data[i])

    X = np.array(X)
    y = np.array(y)

    split = int(len(X) * 0.8)
    train_loader = DataLoader(StockDataset(X[:split], y[:split]), batch_size=32, shuffle=True)
    test_loader = DataLoader(StockDataset(X[split:], y[split:]), batch_size=32, shuffle=False)

    model = LSTMStockPredictor(hidden_dim=64, num_layers=2)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0
        for seq, target in train_loader:
            optimizer.zero_grad()
            output = model(seq)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        if epoch % 10 == 0:
            print(f"Epoch {epoch}/{epochs} - Loss: {total_loss/len(train_loader):.5f}")

    print("Training Complete! Evaluating model...")
    model.eval()
    with torch.no_grad():
        test_preds = []
        for seq, _ in test_loader:
            test_preds.extend(model(seq).numpy())
    
    preds_orig = scaler.inverse_transform(np.array(test_preds))
    actual_orig = scaler.inverse_transform(y[split:])
    
    rmse = np.sqrt(np.mean((preds_orig - actual_orig)**2))
    mae = np.mean(np.abs(preds_orig - actual_orig))
    print(f"Evaluation Metrics: RMSE=\${rmse:.2f}, MAE=\${mae:.2f}")

if __name__ == "__main__":
    train_and_evaluate()
`;
}

export function generateRequirementsTxt(): string {
  return `streamlit>=1.35.0
plotly>=5.22.0
yfinance>=0.2.40
torch>=2.2.0
scikit-learn>=1.4.0
pandas>=2.2.0
numpy>=1.26.0
requests>=2.31.0
`;
}
