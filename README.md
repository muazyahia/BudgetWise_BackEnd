# BudgetWise Backend

Backend for **BudgetWise**, an AI-powered personal budget management platform built with **Node.js**, **Express.js**, and **MongoDB**. The application provides secure RESTful APIs for authentication, budget management, activity planning, AI-powered financial recommendations, user profiles, and real-time communication.

## Live API

**Backend API:** https://budget-wise-back-end-five.vercel.app/

**Frontend:** https://budget-wise-front-end-w7fh.vercel.app/

**Frontend Repository:** https://github.com/MoaazYahia-14/BudgetWise_FrontEnd

---

## Technologies

| Technology | Description |
|------------|-------------|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| TypeScript | Static typing |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| Passport.js | Authorization |
| Cloudinary | Cloud file storage |
| Multer | File upload middleware |
| Socket.IO | Real-time communication |
| Nodemailer | Email service |

---

## Features

- User Authentication
- Email Verification (OTP)
- Password Reset
- Budget Management
- Activity Management
- Personal Plans
- AI Financial Assistant
- User Profile Management
- Cloudinary File Upload
- Real-Time Communication
- Role-Based Authorization

---

## Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── socket/
├── utils/
├── validators/
└── server.ts
```

---

## Installation

### Requirements

- Node.js v18 or later
- MongoDB Atlas Database

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

FRONTEND_URL=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASS=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

### Run the Server

```bash
npm run dev
```

The server will run on:

```text
http://localhost:5000
```

---

## Deployment

The project is ready for deployment on **Vercel**.

Required Environment Variables:

```env
MONGO_URI=

JWT_SECRET=

FRONTEND_URL=https://budget-wise-front-end-w7fh.vercel.app

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASS=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

## Architecture

- RESTful API Architecture
- JWT Authentication
- Role-Based Authorization
- MongoDB Atlas Integration
- Cloudinary File Storage
- Real-Time Communication
- Modular MVC Architecture
- Production Ready

---

## Frontend

The backend powers the BudgetWise Frontend built with **React.js**.

**Frontend:** https://budget-wise-front-end-w7fh.vercel.app/

**Frontend Repository:** https://github.com/MoaazYahia-14/BudgetWise_FrontEnd
