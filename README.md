# Real-Time Chat Application

## Description
This is a real-time chat application developed using the MERN stack. It enables users to register, log in, send and receive real-time messages, and manage their online status. Additionally, it integrates with a language model API for generating responses when the recipient is 'BUSY'.

## Features
- User Authentication (Registration and Login)
- Real-Time Chat Functionality
- Message Storage in MongoDB
- User Online Status Management
- Integration with a Language Model API for Generating Responses

## Installation
1. Clone the repository:
    ```
    git clone https://github.com/haasithp/chat_application_mern.git
    ```

2. Navigate to the project directory:
    ```
    cd real-time-chat-app
    ```

3. Install dependencies:
    ```
    npm install
    ```

## Configuration
1. Create a `.env` file in the root directory with the following environment variables:
    ```
    PORT=9090
    MONGODB_URI=mongodb://localhost:27017/chatapp
    JWT_SECRET=your_jwt_secret
    LLM_API_URL=your_llm_api_url
    ```

    Replace `your_jwt_secret` with a secret key for JWT token encryption and `your_llm_api_url` with the URL of the language model API.

## Usage
1. Start the backend server:
    ```
    npm start
    ```

2. Open another terminal window and navigate to the frontend directory:
    ```
    cd frontend
    ```

3. Install frontend dependencies:
    ```
    npm install
    ```

4. Start the frontend server:
    ```
    npm start
    ```

5. Access the application in your browser at `http://localhost:PORT`.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
