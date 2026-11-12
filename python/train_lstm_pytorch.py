"""
PyTorch LSTM Deep Learning Pipeline for Financial Time Series
NeuralStock Machine Learning Architecture
"""

import numpy as np
import pandas as pd
import yfinance as yf
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt

class StockDataset(Dataset):
    def __init__(self, sequences, targets):
        self.sequences = torch.tensor(sequences, dtype=torch.float32)
        self.targets = torch.tensor(targets, dtype=torch.float32)

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

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

def train_and_evaluate(symbol="NVDA", lookback=30, epochs=40, lr=0.002):
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
        if epoch % 5 == 0:
            print(f"Epoch {epoch}/{epochs} - Train MSE: {total_loss/len(train_loader):.5f}")

    print("\nTraining Complete! Evaluating model on test set...")
    model.eval()
    with torch.no_grad():
        test_preds = []
        for seq, _ in test_loader:
            test_preds.extend(model(seq).numpy())
    
    preds_orig = scaler.inverse_transform(np.array(test_preds))
    actual_orig = scaler.inverse_transform(y[split:])
    
    rmse = np.sqrt(np.mean((preds_orig - actual_orig)**2))
    mae = np.mean(np.abs(preds_orig - actual_orig))
    mape = np.mean(np.abs((preds_orig - actual_orig) / actual_orig)) * 100
    print(f"Evaluation Metrics:")
    print(f"  RMSE: ${rmse:.2f}")
    print(f"  MAE:  ${mae:.2f}")
    print(f"  MAPE: {mape:.2f}%")

if __name__ == "__main__":
    train_and_evaluate()
