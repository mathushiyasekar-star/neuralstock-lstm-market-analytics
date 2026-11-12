# NeuralStock LSTM: Stock Market Analytics & Price Prediction

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.35+-ff4b4b.svg)](https://streamlit.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

An enterprise-grade financial analytics and machine learning platform utilizing **Long Short-Term Memory (LSTM)** recurrent neural networks for multi-step stock price forecasting, high-frequency technical analysis, automated multi-channel price movement alerts, and personalized paper portfolio simulation.

---

## 🌟 Key Features

1. **Long Short-Term Memory (LSTM) Machine Learning Engine**:
   - Multi-layer recurrent LSTM cell implementation with Forget ($f_t$), Input ($i_t$), Candidate State ($\tilde{C}_t$), Memory Cell ($C_t$), and Output ($o_t$) gates.
   - Interactive model training lab: customize lookback sequences (10–60 days), forecast horizon (3–30 days), hidden units (32, 64, 128), and training epochs.
   - Real-time epoch loss convergence tracking ($L_{\text{train}}$ vs. $L_{\text{val}}$ MSE).
   - Multi-step auto-regressive forecast cone with 95% confidence intervals ($\pm 1.96 \cdot \sigma \cdot \sqrt{\Delta t}$).
   - Statistical evaluation metrics: **RMSE**, **MAE**, **MAPE (%)**, **Directional Trend Accuracy (%)**, and **$R^2$**.

2. **Interactive Financial Visualization**:
   - Candlestick and continuous area Line charting.
   - Technical indicators: SMA 20, SMA 50, EMA 20, Bollinger Bands (20, 2), Volume bars.
   - Dedicated indicator subpanels: RSI (14) with 70/30 threshold markers, and MACD (12, 26, 9) with momentum histogram.
   - Multi-timeframe selection: 1D, 1W, 1M, 3M, 6M, 1Y, 5Y with crosshair inspection HUD.

3. **Automated Multi-Channel Price Alerts**:
   - Rules engine for price breaches, percentage swings, and RSI overbought/oversold levels.
   - Automated email dispatch simulation with delivery audit ledger.
   - Browser push notifications (Web Notifications API) and synthesized Web Audio alert chimes.

4. **Encrypted Authentication & Role-Based Access Control (RBAC)**:
   - Web Crypto SHA-256 salted password hashing.
   - Three operational roles:
     - **Trader**: Portfolio management, paper trading terminal, personalized alerts.
     - **Analyst**: Deep access to the LSTM Model Lab, hyperparameter tuning, model training, and backtesting.
     - **Admin**: System-wide oversight, user management, and market data feed controls.

5. **Personalized Portfolio & Paper Trading Simulator**:
   - Real-time position tracking, market value, cost basis, unrealized/realized P&L.
   - Instant Buy/Sell order execution engine.

6. **Full Python & Streamlit Ecosystem Included**:
   - Ready-to-run Python Streamlit application (`python/app_streamlit.py`) with Plotly charts.
   - Standalone PyTorch deep learning training script (`python/train_lstm_pytorch.py`).

---

## 📁 Repository Structure

```text
├── python/                     # Python Machine Learning & Streamlit Project
│   ├── app_streamlit.py        # Streamlit + Plotly interactive dashboard
│   ├── train_lstm_pytorch.py   # Standalone PyTorch LSTM training pipeline
│   └── requirements.txt        # Python library dependencies
├── src/                        # Full-Stack React & TypeScript Platform
│   ├── components/             # UI Components (Charts, Model Lab, Alerts, Portfolio)
│   ├── services/               # LSTM Math Engine, Market Data, Indicators, Auth, Alerts
│   ├── types/                  # TypeScript data contracts & interfaces
│   ├── App.tsx                 # Main application dashboard
│   └── main.tsx                # Client entry point
├── index.html                  # HTML entry point with typography
├── package.json                # Node.js dependencies & scripts
├── vite.config.ts              # Vite configuration
└── README.md                   # Project documentation
```

---

## 🚀 How to Post This Project to GitHub

Follow these steps to create a GitHub repository and push your code:

### Step 1: Initialize Git and Commit Your Files
Open your terminal in the project root directory and run:

```bash
# 1. Initialize local git repository
git init

# 2. Add all files to staging
git add .

# 3. Create your initial commit
git commit -m "feat: Initial commit of NeuralStock LSTM platform"
```

### Step 2: Create a New Repository on GitHub
1. Go to [GitHub.com](https://github.com) and log in.
2. In the top right corner, click the **`+`** icon and select **New repository**.
3. Name your repository (e.g., `neuralstock-lstm-market-analytics`).
4. Choose **Public** or **Private**.
5. **Do NOT** initialize with a README, .gitignore, or license (we already have them).
6. Click **Create repository**.

### Step 3: Link Your Remote and Push
Copy the commands shown on your new GitHub repository page:

```bash
# Rename default branch to main
git branch -M main

# Add your GitHub repository as remote origin (replace with your repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push your code to GitHub
git push -u origin main
```

*(Note: When prompted for your password, use a [GitHub Personal Access Token](https://github.com/settings/tokens) or GitHub SSH key).*

---

## 💻 Running the Web Dashboard Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

---

## 🐍 Running the Python / Streamlit App Locally

```bash
# 1. Navigate to the python directory
cd python

# 2. Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install Python requirements
pip install -r requirements.txt

# 4. Launch the interactive Streamlit dashboard
streamlit run app_streamlit.py

# 5. Train the PyTorch LSTM model from terminal
python train_lstm_pytorch.py
```

---

## 📄 License
This project is licensed under the Apache 2.0 License.
