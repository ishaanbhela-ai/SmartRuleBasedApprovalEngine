# Approval Engine

**Approval Engine** is a robust, API-first Rails application designed to streamline and automate request approval workflows. It features a dynamic rule engine, quota management, and role-based access control, making it suitable for organizations requiring structured approval processes for expenses, leaves, or resource allocations.

## 🚀 Features

-   **Role-Based Access Control (RBAC)**: Secure access for Admins, Approvers, and Standard Users.
-   **Dynamic Rule Engine**: Configure custom rules to automatically approve requests based on criteria (e.g., amount < limit, specific grades).
-   **Quota Management**: Track and enforce limits on request values per user or department.
-   **Auto-Approval Workflow**: Automatically approve requests that meet predefined safety criteria.
-   **Email Notifications**: Instant email alerts for request status updates (Approved/Rejected) via SMTP.
-   **RESTful API**: Fully documented API endpoints for integration with frontend applications.
-   **Swagger Documentation**: Interactive API documentation generated with RSwag.
-   **Background Processing**: Efficient job handling using Solid Queue for emails and heavy tasks.
-   **JWT Authentication**: Secure, stateless authentication mechanism.

## 🛠️ Tech Stack

-   **Framework**: Ruby on Rails 8.1.2
-   **Language**: Ruby 3.2.4
-   **Database**: PostgreSQL
-   **Background Jobs**: Solid Queue
-   **Caching**: Solid Cache
-   **deployment**: Kamal / Docker
-   **Testing**: RSpec
-   **Documentation**: RSwag (OpenAPI)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

-   Ruby 3.2.4
-   PostgreSQL
-   Redis (optional, if used for caching/sidekiq alternatives)
-   Docker (for containerized deployment)

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/approval_engine.git
    cd approval_engine
    ```

2.  **Install Dependencies**
    ```bash
    bundle install
    ```

3.  **Configure Environment Variables**
    Copy the example environment file and update it with your credentials:
    ```bash
    cp .env.example .env
    ```
    *See the [Configuration](#-configuration) section below for details.*

4.  **Database Setup**
    Create and migrate the database:
    ```bash
    rails db:create
    rails db:migrate
    rails db:seed # (Optional: Loads initial data)
    ```

5.  **Start the Server**
    ```bash
    bin/rails server
    ```
    The API will be available at `http://localhost:3000`.

## 🔧 Configuration

The application uses `dotenv` to manage environment variables. Ensure your `.env` file includes the following:

### Authentication
```properties
JWT_SECRET="your_production_secure_secret"
JWT_EXPIRY=24  # Token expiry in hours
```

### Email (SMTP)
Required for sending notifications. Example for Gmail:
```properties
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=google.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_AUTHENTICATION=plain
```

### Database (If not using default config/database.yml)
```properties
DATABASE_URL=postgres://user:password@localhost:5432/approval_engine_development
```

## 📚 API Documentation

The specific API documentation is available via Swagger UI.

1.  Start the Rails server.
2.  Navigate to: `http://localhost:3000/api-docs`

Use this interface to explore endpoints, test requests, and view response schemas.

## 🧪 Testing

This project uses **RSpec** for testing. To run the test suite:

```bash
bundle exec rspec
```

To run a specific test file:
```bash
bundle exec rspec spec/controllers/api/v1/requests_controller_spec.rb
```

## 🐳 Deployment

This application is configured for deployment using **Kamal** and **Docker**.

1.  Ensure Docker is running.
2.  Configure your `config/deploy.yml`.
3.  Deploy:
    ```bash
    kamal setup
    kamal deploy
    ```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
