#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始部署filterbubble项目到Surge.sh...${NC}"

# 1. 清理之前的构建
echo -e "${GREEN}1. 清理之前的构建...${NC}"
rm -rf dist

# 2. 构建项目 - 使用生产模式确保样式正确处理
echo -e "${GREEN}2. 构建项目...${NC}"
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}构建失败，请检查错误信息${NC}"
  exit 1
fi

# 3. 部署到Surge.sh
echo -e "${GREEN}3. 部署到Surge.sh...${NC}"
npx surge dist filterbubble.surge.sh

echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}你的应用现在可以通过以下URL访问：${NC}"
echo -e "${YELLOW}https://filterbubble.surge.sh${NC}"
