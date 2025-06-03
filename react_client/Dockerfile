# This file is run by Docker to deploy and run the site

FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copies all project files in the app to Docker (except for files named in .dockerignore)
COPY . .

# Default port of Vite
EXPOSE 5173

CMD [ "npm", "run", "dev" ]
