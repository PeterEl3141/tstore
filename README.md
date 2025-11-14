# Con Fuoco – T-Shirt Store

Con Fuoco is a full-stack e-commerce application for selling T-shirts. Users can browse products, create an account, add items to their cart, and securely complete payments via Stripe.

---

## Demo

- Live site: https://www.con-fuoco.co.uk/

---

## Tech Stack

**Frontend**

- React
- JavaScript 
- CSS 
- Axios for API calls

**Backend**

- Node.js
- Express
- Prisma ORM
- PostgreSQL

**Payments & Auth**

- Stripe (Checkout / Payment Intents)
- JSON Web Tokens (JWT) 
- bcrypt 

---

## Features

- **User Accounts**
  - Sign up, log in, and log out
  - Persisted user data in PostgreSQL via Prisma

- **Product Browsing**
  - List of available T-shirts
  - Individual product pages with details such as price, description, etc.

- **Shopping Cart**
  - Add items to cart
  - Update quantities / remove items
  - Cart state persisted while navigating the site

- **Secure Checkout with Stripe**
  - Stripe-powered payment flow
  - Orders only created on successful payment 
  - Basic error handling for failed or cancelled payments

- **Order Handling 
  - Store order details in the database
  - View past orders for logged-in users
  - An admin can view all orders

---

## Project Structure

- `/frontend` – React frontend
- `/backend` – Express + Node.js backend with Prisma and PostgreSQL



## Getting Started

### Prerequisites

- Node.js (version X.Y.Z or higher)
- PostgreSQL running locally or in the cloud
- A Stripe account and API keys

### 1. Clone the repository

git clone https://github.com/your-username/con-fuoco.git
cd con-fuoco


### 2. Install dependencies
# In the backend terminal
npm install

# In the frontend terminal
npm install


### 3. env setup 

.env variables in the backend:


DATABASE_URL
STRIPE_SECRET
STRIPE_WEBHOOK_SECRET
FRONTEND_URL
JWT_SECRET
JWT_EXPIRES_IN

AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
S3_BUCKET
S3_PUBLIC_BASE
GELATO_API_KEY
GELATO_ENV
GELATO_SHIPMENT_UID
RETURN_NAME
RETURN_LINE1
RETURN_LINE2
RETURN_CITY
RETURN_STATE
RETURN_POSTCODE
RETURN_COUNTRY
RETURN_EMAIL
RETURN_PHONE
RESEND_API_KEY
MAIL_FROM

ENABLE_FULFILLMENT_CRON



.env variables in the frontend:
VITE_API_BASE_URL
VITE_STRIPE_PUBLISHABLE_KEY


### 4. Database Setup
npx prisma migrate dev
npx prisma db seed

### 5. Start the app
npm run dev (both terminals)


## What I Learned:
Integrating a Stripe payment system into the project.
Reinforced understanding of prisma; 'select'ing the correct data.
Formatting files correctly in order to make the right API calls to gelato.
