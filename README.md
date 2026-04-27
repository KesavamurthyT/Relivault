<div align="center">

# 🏦 Relivault - Transparent & Secure Disaster Relief Fund Tracking

**Next-Gen Web3 Platform for Immutable Fund Flow Monitoring**
***

<h1>🛡️ Relivault</h1>

*"Trust in Every Transaction" - Securing disaster relief with IPFS and Smart Contracts*

Transparent fund tracking · Immutable Document Storage · Role-Based Access · NFT Donor Recognition

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js_15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Design-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Web3-Ethers.js-3C3C3D?style=for-the-badge&logo=ethereum" alt="Ethers.js" />
  <img src="https://img.shields.io/badge/Blockchain-Hardhat-FFF000?style=for-the-badge&logo=solidity" alt="Hardhat" />
  <img src="https://img.shields.io/badge/Storage-IPFS-65C2CB?style=for-the-badge&logo=ipfs" alt="IPFS" />
  <img src="https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
</p>


</div>

##  Problem

During disaster relief efforts, there is often a significant lack of transparency in how funds are distributed. Donors are left wondering if their contributions reached the intended victims, while administrative inefficiencies and misallocation of resources hinder the effectiveness of relief organizations (NGOs).

## Solution

**Relivault** introduces a decentralized, tamper-proof tracking system. Using blockchain smart contracts and IPFS for immutable document storage, Relivault guarantees that every transaction is publicly verifiable, documents cannot be altered, and funds are strictly monitored from donors to victims.

##  Features

- **Transparent Fund Tracking:** Real-time visibility of donations, claims, and organization disbursements.
- **Immutable Document Storage:** IPFS integration ensures uploaded identity and claim documents cannot be altered.
- **Role-Based Security:** Compartmentalized, secure access control for Victims, NGOs, Donors, and system Admins.
- **Real-Time Analytics Dashboard:** Deep visibility into fund flows, transaction volumes, and relief statistics.
- **NFT-Based Donor Recognition:** Donors receive digital, verifiable certificates (NFTs) as a badge of appreciation.
- **Secure Authentication:** Firebase-powered role verification combined with secure Web3 MetaMask wallet connections.

##  Tech Stack

- **Frontend Core:** React 19, Next.js 15, TypeScript
- **Styling & UI:** Tailwind CSS, Radix UI, Recharts, Lucide React
- **Authentication:** Firebase Admin SDK, React Firebase Hooks
- **Database Backend:** MongoDB (Mongoose)
- **Web3 / Blockchain:** Ethers.js, Hardhat, Solidity Smart Contracts
- **Decentralized Storage:** IPFS & Pinata
- **Wallets:** MetaMask integration

##  Architecture

Relivault employs a modern hybrid Web2 / Web3 architecture:
1. **Client Layer:** Next.js application served to end-users (Victims, Donors, NGOs). Wallet connection is facilitated via MetaMask.
2. **API & Data Layer:** Next.js API Routes process business logic, with traditional data (user roles, standard records) residing in MongoDB, while Firebase handles session authentication and auth rules.
3. **Decentralized Layer:** 
   - Files and sensitive claims evidence are instantly pinned to **IPFS** for immutability.
   - Financial ledger entries, disbursements, and NFT Minting are transacted on-chain via **Solidity Smart Contracts** (deployed via Hardhat).

##  Setup / Installation

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [MetaMask](https://metamask.io/) browser extension
- A [MongoDB](https://www.mongodb.com/) instance/cluster
- A [Firebase](https://firebase.google.com/) Project
- An IPFS pinning service (e.g., [Pinata](https://www.pinata.cloud/))

### Running Locally

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Relivault-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```ini
   # MongoDB
   MONGO_URI=your_mongodb_connection_string

   # Firebase
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   # ... add other required Firebase / IPFS environment keys
   ```

4. **Local Blockchain & Contracts (Optional)**
   If you want to run a local Hardhat node for testing smart contracts:
   ```bash
   npx hardhat node
   # In a separate terminal:
   npx hardhat ignition deploy ignition/modules/deploy.js --network localhost
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) to view the application.*

## 🔮 Future Work

- **Multi-Chain Support:** Expanding from testnets to multiple L2 production networks (e.g., Polygon, Arbitrum) for lower gas fees.
- **AI Fraud Detection:** Incorporating machine learning models to automatically verify victim claims and detect anomalies in submitted relief documents.
- **Fiat On-Ramps:** Allowing donors to contribute using direct credit card or UPI payments, seamlessly swapped into stablecoins on the backend.
- **Mobile Application:** A React Native PWA port for victims lacking desktop access.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
