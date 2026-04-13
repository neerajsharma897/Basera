# Basera

**Basera** is a full-stack web application for listing and booking travel accommodations. Users can browse listings, create accounts, add their own properties, leave reviews, and manage their listings with image uploads.

## Features

- 🏠 **Listings** - Browse, create, edit, and delete accommodation listings
- 🔐 **Authentication** - User signup, login, and logout using Passport.js
- 📝 **Reviews** - Add and delete reviews on listings
- 🖼️ **Image Upload** - Upload listing images to private AWS S3 with presigned display URLs
- ✅ **Authorization** - Only owners can edit/delete their listings
- 💬 **Flash Messages** - User-friendly success and error notifications
- 🛡️ **Data Validation** - Server-side validation using Joi

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Templating:** EJS with EJS-Mate layouts
- **Authentication:** Passport.js with passport-local-mongoose
- **File Upload:** Multer + AWS S3 (multer-s3) with presigned read URLs
- **Styling:** CSS

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/neerajsharma897/Basera.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Basera
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory:
   ```env
   MONGO_URL=your_mongodb_connection_string
   SECRET=your_session_secret
   AWS_REGION=your_aws_region
   S3_BUCKET_NAME=your_s3_bucket_name
   AWS_CLOUDWATCH_LOG_GROUP=/basera/app
   # S3 bucket should stay private; the app generates presigned URLs for listing images
   ```

5. Run the app:
   ```bash
   node app.js
   ```

## Usage

1. Open your browser and navigate to `http://localhost:8080`
2. Sign up for a new account or login
3. Browse existing listings or create your own
4. Add reviews to listings you've visited

## Project Structure

```
├── app.js              # Main application entry point
├── cloudConfig.js      # AWS S3 upload configuration
├── middleware.js       # Custom middleware (auth, validation)
├── schema.js           # Joi validation schemas
├── controllers/        # Route controllers
├── models/             # Mongoose models
├── routes/             # Express routes
├── views/              # EJS templates
├── public/             # Static assets (CSS, JS, images)
├── utils/              # Utility functions
└── init/               # Database seed data
```

## License

ISC

