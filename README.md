# Stellar Fund

StellarFund is a decentralized crowdfunding platform built on the Stellar blockchain. This project consists of a backend server and a Vue.js frontend application.

You can view the demo here: https://www.loom.com/share/d5c2633dc4cd48a9aa75d9b76175dbae?sid=e780c6ea-4428-4816-b998-cca7c45ba5ba

## Screenshots

![image](https://github.com/user-attachments/assets/c254014a-5fa4-4e8e-a079-0edbcc9c0032)

![image](https://github.com/user-attachments/assets/8f902966-ede8-4b7a-a40d-923db8b5a397)

![image](https://github.com/user-attachments/assets/7654b9c4-e72c-4ce7-bec2-cf7aaad373ab)

![image](https://github.com/user-attachments/assets/bcdef257-288c-4ddf-a5b8-e58301249f52)

![image](https://github.com/user-attachments/assets/b6b077fd-fcb4-4e88-85be-a6c184ed7255)

![image](https://github.com/user-attachments/assets/d27de957-ff29-43b4-81f0-211ea933b79a)

![image](https://github.com/user-attachments/assets/9e43e1d6-76d7-496e-8489-878af400d382)



## Prerequisites

Before you begin, ensure you have met the following requirements:

* You have installed [Node.js](https://nodejs.org/) (version 20.x or higher)
* You have a Windows/Linux/Mac machine
* You have installed [Git](https://git-scm.com/)

## Project setup
```
git clone https://github.com/harishkotra/stellar-fund.git
cd stellarfund
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Backend Configuration

- Navigate to the `stellar-fund-backend` folder
- Create a `.env` file based on `.env.example`
- Fill in the necessary environment variables (e.g., Firebase is required for storing the campaign data)
 
## Running StellarFund

To run StellarFund, follow these steps:

1. Start the backend server
   ```
    npm run start
    ```

    The backend server will start running on `http://localhost:3000` (or the port specified in your `.env` file)

2. In a new terminal, start the frontend application

    ```
    cd ../
    npm run serve
    ```

    The frontend application will start running on `http://localhost:8080` (or another available port)

3. Open your web browser and navigate to `http://localhost:8080` to use the Stellar Fund application

## Building for Production

To build the frontend for production:

    npm run build

## Contributing to StellarFund

To contribute to StellarFund, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## Tech Stack

StellarFund is built using a modern web development stack, leveraging the power of JavaScript both on the frontend and backend. Here's an overview of the technologies used:

### Frontend
- **Vue.js 3**: A progressive JavaScript framework for building user interfaces
- **PrimeVue**: UI component library for Vue.js applications
- **Axios**: Promise-based HTTP client for making API requests
- **Vuex**: State management pattern + library for Vue.js applications
- **Vue Router**: Official router for Vue.js

### Backend
- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine
- **Express.js**: Web application framework for Node.js
- **Stellar SDK**: Official Stellar library for interacting with the Stellar network

### Blockchain
- **Stellar Network**: Decentralized, open-source blockchain platform

### Development Tools
- **Vite**: Next generation frontend tooling for Vue.js
- **ESLint**: Pluggable JavaScript linter
- **Prettier**: Opinionated code formatter

### APIs
- **Random User API**: External API for generating random user profiles

### Database
- **Firebase Realtime Database**: Database for storing application data (campaign details, user information)

### Version Control
- **GitHub**: Hosting platform for version control and collaboration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
