FROM node:20-alpine

WORKDIR /app

# 複製 package files
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源碼
COPY . .

# 建置 TypeScript
RUN npm run build

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 啟動應用
CMD ["npm", "start"]
