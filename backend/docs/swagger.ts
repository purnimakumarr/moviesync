/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Search for movies by title
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               type:
 *                 type: string
 *                 example: "movie"
 *               year:
 *                 type: string
 *                 example: "2010"
 *               page:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: A list of matching movies
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/getById:
 *   post:
 *     summary: Get movie details by IMDb ID
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Movie details retrieved successfully
 *       400:
 *         description: IMDb ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/favourite/add:
 *   post:
 *     summary: Add a movie to favourites
 *     tags: [Favourites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Favourite added successfully
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/favourite/list:
 *   post:
 *     summary: Get user's favourite movies
 *     tags: [Favourites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: List of favourite movies
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/favourite/delete:
 *   post:
 *     summary: Remove a movie from favourites
 *     tags: [Favourites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Favourite removed successfully
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/favourite/clear:
 *   post:
 *     summary: Clear all favourite movies for a user
 *     tags: [Favourites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: All favourites cleared
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watch-later/add:
 *   post:
 *     summary: Add a movie to watch later
 *     tags: [Watch Later]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Movie added to Watch Later
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watch-later/list:
 *   post:
 *     summary: Get user's watch later movies
 *     tags: [Watch Later]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: List of watch later movies
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watch-later/clear:
 *   post:
 *     summary: Clear all watch later movies for a user
 *     tags: [Watch Later]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: All watch later cleared
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watched/add:
 *   post:
 *     summary: Mark a movie as watched
 *     tags: [Watched]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Movie marked as watched
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watched/list:
 *   post:
 *     summary: Get user's watched movies
 *     tags: [Watched]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: List of watched movies
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watched/clear:
 *   post:
 *     summary: Clear all watched movies for a user
 *     tags: [Watched]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: All watched cleared
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/watch/delete:
 *   post:
 *     summary: Remove a movie from watch Later or watched
 *     tags: [Watchlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               imdbID:
 *                 type: string
 *                 example: "tt1375666"
 *     responses:
 *       200:
 *         description: Movie removed from watchlist
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/user/create-user:
 *   post:
 *     summary: Create a new user
 *     description: Adds a user to the database using their email (hashed).
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userID
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: User successfully created
 *       400:
 *         description: Missing user email
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/get-user:
 *   post:
 *     summary: Retrieve user details
 *     description: Fetches user details using the hashed email.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userID
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: Missing user email
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/update-user:
 *   post:
 *     summary: Update user details
 *     description: Updates user information such as name, phone, and date of birth.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userID
 *               - firstName
 *               - lastName
 *             properties:
 *               userID:
 *                 type: string
 *                 example: "user@example.com"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               middleName:
 *                 type: string
 *                 example: "A."
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
