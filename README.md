# Stellar Fund

StellarFund is a decentralized crowdfunding platform built on the Stellar blockchain. This project consists of a backend server and a Vue.js frontend application.

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

    ```
    npm run build
    ```

## Contributing to StellarFund

To contribute to StellarFund, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.