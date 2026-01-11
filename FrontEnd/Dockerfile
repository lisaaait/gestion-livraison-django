# Stage 1: Build the app
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Vite build output is 'dist' folder
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: Add custom nginx config for React Router support
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]