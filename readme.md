# Node.js microservice SocialMediaService advance architecture project
## Redis for caching posts
## IP based rate limiting feature
## RabbitMQ as message broker for microservice communication
## accessToken , refreshTokens for authentication
## Joi for validations
## MongoDB database
## mongoose ODM
## proxying microservices using single point of incoming requests via api-gateway

# PROXY 
[localhost:3000/v1/api/auth/register](link)  >>> should be re-directed to >>> 
[localhost:3001/api/auth/register](link) >>> using express-http-proxy npm package
