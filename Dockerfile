# Use nginx image to serve static files
FROM nginx:alpine

# Copy app files to nginx directory
COPY index.html /usr/share/nginx/html/
COPY package.json /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
