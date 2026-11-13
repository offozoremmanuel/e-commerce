import type { JsonObject } from 'swagger-ui-express';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const success = (schema: JsonObject, description = 'Successful response') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['data'],
        properties: { data: schema }
      }
    }
  }
});
const error = (description: string) => ({
  description,
  content: { 'application/json': { schema: ref('ErrorResponse') } }
});
const jsonBody = (schema: JsonObject) => ({
  required: true,
  content: { 'application/json': { schema } }
});
const uuidParameter = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' }
});
const authResponses = {
  401: error('Missing, invalid, or expired bearer token')
};
export const openApiSpec: JsonObject = {
  openapi: '3.0.3',
  info: {
    title: 'E-commerce API',
    version: '1.0.0',
    description: [
      'REST API for the e-commerce application.',
      '',
      'All registered accounts have the USER role. Product and category catalog endpoints are read-only; product creation is an internal backend operation and is not exposed over HTTP.',
      '',
      'All successful JSON responses use a `{ "data": ... }` envelope. Errors use `{ "error": { "code": "...", "message": "..." } }`.'
    ].join('\n')
  },
  servers: [
    { url: 'https://e-commerce-ovfh.onrender.com/api', description: 'Hosted API' },
    { url: 'http://localhost:3000/api', description: 'Local development API' }
  ],
  tags: [
    {
      name: 'Authentication',
      description: [
        'Signup and password recovery send a six-digit OTP email through Brevo. Codes expire in 10 minutes, can be used once, and allow up to five verification attempts.',
        '',
        'The signup email subject is **Your email verification code** and its message asks the user to verify their email address.',
        '',
        'The password reset email subject is **Your password reset code** and its message asks the user to reset their password.',
        '',
        'Both HTML and plain-text email versions include the user name, OTP, 10-minute expiry, and a reminder not to share the code. Email bodies are sent to the recipient and are not returned by the API.'
      ].join('\n')
    },
    { name: 'Users' },
    { name: 'Products' },
    { name: 'Categories' },
    { name: 'Cart' },
    { name: 'Orders' },
    { name: 'Reviews' }
  ],
  security: [],
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a USER account',
        description: [
          'Creates an unverified user account and sends the signup OTP email through Brevo. Verify the email address to receive a bearer access token.',
          '',
          '**Email template**',
          '',
          '- Subject: `Your email verification code`',
          '- Heading: `Verify your email address`',
          '- Body: greets the user by name, gives the six-digit code to complete sign-up, states that it expires in 10 minutes and can only be used once, and warns the recipient not to share it.',
          '- Both HTML and plain-text versions are sent. The email itself is not included in the API response.'
        ].join('\n'),
        requestBody: jsonBody(ref('SignUpRequest')),
        responses: {
          201: success(ref('Message'), 'Account created and verification code sent'),
          400: error('Invalid request body'),
          409: error('Email address is already registered'),
          502: error('Email provider could not deliver the verification code'),
          503: error('Email delivery is not configured'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/signin': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in',
        requestBody: jsonBody(ref('SignInRequest')),
        responses: {
          200: success(ref('Session'), 'Signed in'),
          400: error('Invalid request body'),
          401: error('Email or password is incorrect'),
          403: error('Email address has not been verified'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify an email address',
        description: 'Consumes a one-time six-digit code sent during signup and returns a bearer access token. Codes expire after 10 minutes and allow up to five attempts.',
        requestBody: jsonBody(ref('VerifyEmailRequest')),
        responses: {
          200: success(ref('Session'), 'Email verified'),
          400: error('Invalid, expired, or already-used code'),
          429: error('Too many verification requests'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend an email verification code',
        description: 'Sends a new signup verification email using the **Your email verification code** template if the account exists and is not yet verified. The response does not reveal whether the account exists.',
        requestBody: jsonBody(ref('EmailRequest')),
        responses: {
          200: success(ref('Message')),
          400: error('Invalid email address'),
          429: error('Too many verification requests'),
          502: error('Email provider could not deliver the code'),
          503: error('Email delivery is not configured'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request a password reset code',
        description: [
          'Emails a one-time password-reset code when an account exists. The response does not reveal whether the account exists.',
          '',
          '**Email template**',
          '',
          '- Subject: `Your password reset code`',
          '- Heading: `Reset your password`',
          '- Body: greets the user by name, gives the six-digit code to reset the password, states that it expires in 10 minutes and can only be used once, and warns the recipient not to share it.',
          '- Both HTML and plain-text versions are sent. The email itself is not included in the API response.',
          '',
          'Submit the emailed code and a new password to `POST /auth/reset-password`.'
        ].join('\n'),
        requestBody: jsonBody(ref('EmailRequest')),
        responses: {
          200: success(ref('Message')),
          400: error('Invalid email address'),
          429: error('Too many password reset requests'),
          502: error('Email provider could not deliver the code'),
          503: error('Email delivery is not configured'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset a password with an emailed code',
        description: 'Consumes the single-use six-digit OTP sent by `POST /auth/forgot-password` and updates the password. The code expires after 10 minutes and allows up to five attempts.',
        requestBody: jsonBody(ref('ResetPasswordRequest')),
        responses: {
          200: success(ref('Message')),
          400: error('Invalid request or code'),
          429: error('Too many password reset attempts'),
          500: error('Unexpected server error')
        }
      }
    },
    '/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change the signed-in user password',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(ref('ChangePasswordRequest')),
        responses: {
          200: success(ref('Message')),
          400: error('Invalid request or incorrect current password'),
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      }
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get the signed-in user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: success(ref('User')),
          401: authResponses[401],
          404: error('User account was not found'),
          500: error('Unexpected server error')
        }
      },
      patch: {
        tags: ['Users'],
        summary: 'Update the signed-in user profile',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(ref('UpdateProfileRequest')),
        responses: {
          200: success(ref('User')),
          400: error('Invalid request body'),
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete the signed-in user account',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Account deleted' },
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      }
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List active products',
        description: 'Returns active products ordered newest first. Product creation and modification are not available through the public API.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'q', in: 'query', description: 'Case-insensitive product-name search', schema: { type: 'string' } }
        ],
        responses: {
          200: success(ref('ProductPage')),
          400: error('Invalid category ID'),
          500: error('Unexpected server error')
        }
      }
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get an active product',
        parameters: [uuidParameter('id', 'Product ID')],
        responses: {
          200: success(ref('ProductWithCategory')),
          400: error('Product ID must be a UUID'),
          404: error('Product was not found'),
          500: error('Unexpected server error')
        }
      }
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: {
          200: success({ type: 'array', items: ref('CategoryWithCount') }),
          500: error('Unexpected server error')
        }
      }
    },
    '/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get a category',
        parameters: [uuidParameter('id', 'Category ID')],
        responses: {
          200: success(ref('CategoryWithCount')),
          400: error('Category ID must be a UUID'),
          404: error('Category was not found'),
          500: error('Unexpected server error')
        }
      }
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get the signed-in user cart',
        description: 'Creates an empty cart if the user does not already have one.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: success(ref('Cart')),
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove all items from the cart',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Cart cleared' },
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      }
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add a product to the cart',
        description: 'Adds the requested quantity to any existing quantity for the product.',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(ref('AddCartItemRequest')),
        responses: {
          200: success(ref('Cart')),
          400: error('Invalid request body'),
          401: authResponses[401],
          404: error('Product was not found'),
          409: error('Insufficient inventory'),
          500: error('Unexpected server error')
        }
      }
    },
    '/cart/items/{productId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Set a cart item quantity',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('productId', 'Product ID')],
        requestBody: jsonBody(ref('UpdateCartItemRequest')),
        responses: {
          200: success(ref('Cart')),
          400: error('Invalid product ID or quantity'),
          401: authResponses[401],
          404: error('Cart item was not found'),
          409: error('Product is unavailable or stock is insufficient'),
          500: error('Unexpected server error')
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove a product from the cart',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('productId', 'Product ID')],
        responses: {
          204: { description: 'Cart item removed' },
          400: error('Product ID must be a UUID'),
          401: authResponses[401],
          404: error('Cart item was not found'),
          500: error('Unexpected server error')
        }
      }
    },
    '/orders/checkout': {
      post: {
        tags: ['Orders'],
        summary: 'Create an order from the cart',
        description: 'Reserves inventory, creates an order from the current cart, and empties the cart.',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(ref('CheckoutRequest')),
        responses: {
          201: success(ref('Order')),
          400: error('Invalid request or cart is empty'),
          401: authResponses[401],
          409: error('Cart contents are unavailable or inventory is insufficient'),
          500: error('Unexpected server error')
        }
      }
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List the signed-in user orders',
        security: [{ bearerAuth: [] }],
        responses: {
          200: success({ type: 'array', items: ref('Order') }),
          401: authResponses[401],
          500: error('Unexpected server error')
        }
      }
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get one of the signed-in user orders',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('id', 'Order ID')],
        responses: {
          200: success(ref('Order')),
          400: error('Order ID must be a UUID'),
          401: authResponses[401],
          404: error('Order was not found'),
          500: error('Unexpected server error')
        }
      }
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel a pending order',
        description: 'Only the owner can cancel their order. Inventory is restored when cancellation succeeds.',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('id', 'Order ID')],
        responses: {
          200: success(ref('Order')),
          400: error('Order ID must be a UUID'),
          401: authResponses[401],
          404: error('Order was not found'),
          409: error('Order is no longer cancellable'),
          500: error('Unexpected server error')
        }
      }
    },
    '/reviews/products/{productId}': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a product',
        parameters: [uuidParameter('productId', 'Product ID')],
        responses: {
          200: success({ type: 'array', items: ref('Review') }),
          400: error('Product ID must be a UUID'),
          500: error('Unexpected server error')
        }
      },
      post: {
        tags: ['Reviews'],
        summary: 'Review a purchased product',
        description: 'A review can be created only by a user who has purchased the product in a paid, processing, shipped, or delivered order.',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('productId', 'Product ID')],
        requestBody: jsonBody(ref('CreateReviewRequest')),
        responses: {
          201: success(ref('Review')),
          400: error('Invalid product ID or review body'),
          401: authResponses[401],
          403: error('A completed purchase is required'),
          404: error('Product was not found'),
          500: error('Unexpected server error')
        }
      }
    },
    '/reviews/{id}': {
      patch: {
        tags: ['Reviews'],
        summary: 'Update your review',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('id', 'Review ID')],
        requestBody: jsonBody(ref('UpdateReviewRequest')),
        responses: {
          200: success(ref('Review')),
          400: error('Invalid review ID or request body'),
          401: authResponses[401],
          404: error('Review was not found'),
          500: error('Unexpected server error')
        }
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete your review',
        security: [{ bearerAuth: [] }],
        parameters: [uuidParameter('id', 'Review ID')],
        responses: {
          204: { description: 'Review deleted' },
          400: error('Review ID must be a UUID'),
          401: authResponses[401],
          404: error('Review was not found'),
          500: error('Unexpected server error')
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use the accessToken returned by sign-up or sign-in.'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'INVALID_REQUEST' },
              message: { type: 'string', example: 'Please check the information you entered and try again.' },
              details: { type: 'object', additionalProperties: true }
            }
          }
        }
      },
      Message: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string' } }
      },
      EmailRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', maxLength: 254 } }
      },
      SignUpRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 254 },
          password: { type: 'string', minLength: 12, description: 'Maximum 72 UTF-8 bytes.' },
          fullName: { type: 'string', minLength: 2, maxLength: 100 }
        }
      },
      SignInRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 254 },
          password: { type: 'string', minLength: 1, description: 'Maximum 72 UTF-8 bytes.' }
        }
      },
      VerifyEmailRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 254 },
          otp: { type: 'string', pattern: '^\\d{6}$', example: '012345' }
        }
      },
      ResetPasswordRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'otp', 'password'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 254 },
          otp: { type: 'string', pattern: '^\\d{6}$', example: '012345' },
          password: { type: 'string', minLength: 12, description: 'New password; maximum 72 UTF-8 bytes.' }
        }
      },
      ChangePasswordRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1, description: 'Maximum 72 UTF-8 bytes.' },
          newPassword: { type: 'string', minLength: 12, description: 'Maximum 72 UTF-8 bytes.' }
        }
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'fullName', 'role'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { type: 'string', enum: ['USER'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Session: {
        type: 'object',
        required: ['accessToken', 'tokenType', 'expiresIn', 'user'],
        properties: {
          accessToken: { type: 'string', description: 'JWT bearer access token' },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresIn: { type: 'integer', example: 3600, description: 'Token lifetime in seconds' },
          user: ref('User')
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['fullName'],
        properties: { fullName: { type: 'string', minLength: 2, maxLength: 100 } }
      },
      Category: {
        type: 'object',
        required: ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CategoryWithCount: {
        allOf: [
          ref('Category'),
          {
            type: 'object',
            properties: { _count: { type: 'object', properties: { products: { type: 'integer' } } } }
          }
        ]
      },
      Product: {
        type: 'object',
        required: ['id', 'name', 'description', 'sku', 'priceMinor', 'currency', 'inventoryQuantity', 'imageUrl', 'isActive', 'categoryId', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          sku: { type: 'string' },
          priceMinor: { type: 'string', description: 'Integer minor currency units, serialized as a string.' },
          currency: { type: 'string', minLength: 3, maxLength: 3, example: 'NGN' },
          inventoryQuantity: { type: 'integer' },
          imageUrl: { type: 'string', format: 'uri', nullable: true },
          isActive: { type: 'boolean' },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ProductWithCategory: {
        allOf: [
          ref('Product'),
          { type: 'object', properties: { category: { allOf: [ref('Category')], nullable: true } } }
        ]
      },
      ProductPage: {
        type: 'object',
        required: ['products', 'page', 'limit', 'total'],
        properties: {
          products: { type: 'array', items: ref('ProductWithCategory') },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' }
        }
      },
      CartItem: {
        type: 'object',
        required: ['cartId', 'productId', 'quantity', 'product'],
        properties: {
          cartId: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          product: ref('Product')
        }
      },
      Cart: {
        type: 'object',
        required: ['id', 'userId', 'createdAt', 'updatedAt', 'items'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          items: { type: 'array', items: ref('CartItem') }
        }
      },
      AddCartItemRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, maximum: 99 }
        }
      },
      UpdateCartItemRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['quantity'],
        properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 } }
      },
      ShippingAddress: {
        type: 'object',
        additionalProperties: false,
        required: ['fullName', 'addressLine1', 'city', 'state', 'country', 'phone'],
        properties: {
          fullName: { type: 'string', minLength: 2 },
          addressLine1: { type: 'string', minLength: 3 },
          addressLine2: { type: 'string' },
          city: { type: 'string', minLength: 1 },
          state: { type: 'string', minLength: 1 },
          postalCode: { type: 'string' },
          country: { type: 'string', minLength: 2 },
          phone: { type: 'string', minLength: 5 }
        }
      },
      CheckoutRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['shippingAddress'],
        properties: { shippingAddress: ref('ShippingAddress') }
      },
      OrderItem: {
        type: 'object',
        required: ['id', 'orderId', 'productId', 'productName', 'unitPriceMinor', 'quantity'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderId: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid', nullable: true },
          productName: { type: 'string' },
          unitPriceMinor: { type: 'string', description: 'Integer minor currency units, serialized as a string.' },
          quantity: { type: 'integer' }
        }
      },
      Order: {
        type: 'object',
        required: ['id', 'userId', 'status', 'totalMinor', 'currency', 'shippingAddress', 'createdAt', 'updatedAt', 'items'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
          totalMinor: { type: 'string', description: 'Integer minor currency units, serialized as a string.' },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          shippingAddress: ref('ShippingAddress'),
          paymentReference: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          items: { type: 'array', items: ref('OrderItem') },
          payment: { allOf: [ref('Payment')], nullable: true }
        }
      },
      Payment: {
        type: 'object',
        required: ['id', 'orderId', 'reference', 'status', 'amountMinor', 'currency', 'provider', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderId: { type: 'string', format: 'uuid' },
          reference: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] },
          amountMinor: { type: 'string', description: 'Integer minor currency units, serialized as a string.' },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          provider: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Review: {
        type: 'object',
        required: ['id', 'userId', 'productId', 'rating', 'comment', 'createdAt', 'updatedAt', 'user'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, fullName: { type: 'string' } } }
        }
      },
      CreateReviewRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 2000, default: '' }
        }
      },
      UpdateReviewRequest: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', maxLength: 2000 }
        }
      }
    }
  }
};
