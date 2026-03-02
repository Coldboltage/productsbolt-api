FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]