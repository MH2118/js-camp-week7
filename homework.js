// ========================================
// 第七週作業：使用第三方套件優化電商系統
// 執行方式：npm install && node homework.js
// ========================================

// 載入環境變數與套件
require('dotenv').config({ path: '.env' });
const dayjs = require('dayjs');
const axios = require('axios');

// API 設定（從 .env 讀取）
const API_PATH = process.env.API_PATH;
const BASE_URL = 'https://livejs-api.hexschool.io';
const ADMIN_TOKEN = process.env.API_KEY;

// ========================================
// 任務一：日期處理 - dayjs
// ========================================

/**
 * 1. 將 Unix timestamp 轉換為可讀日期
 * @param {number} timestamp - Unix timestamp（秒）
 * @returns {string} - 格式 'YYYY/MM/DD HH:mm'，例如 '2024/01/01 08:00'
 */
function formatOrderDate(timestamp) {
  // 請實作此函式
  // 提示：dayjs.unix(timestamp).format('YYYY/MM/DD HH:mm')
  return dayjs.unix(timestamp).format('YYYY/MM/DD HH:mm')
}

/**
 * 2. 計算訂單距今幾天
 * @param {number} timestamp - Unix timestamp（秒）
 * @returns {string} - 例如 '3 天前' 或 '今天'
 */
function getDaysAgo(timestamp) {
  // 請實作此函式
  // 提示：
  // 1. 用 dayjs() 取得今天
  // 2. 用 dayjs.unix(timestamp) 取得訂單日期
  // 3. 用 .diff() 計算天數差異
  const today = dayjs(); //1.
  const orderDay = dayjs.unix(timestamp); // 2.
  const orderDaysAgo = today.diff(dayjs.unix(timestamp), 'day'); // 3.
  //如果是今天會顯示0，所以要另外用if
  if (orderDaysAgo === 0) {
    return '今天'
  } else
    return `這是${orderDaysAgo} 天前的訂單`;
}

/**
 * 3. 判斷訂單是否超過 7 天（可能需要催付款）
 * @param {number} timestamp - Unix timestamp（秒）
 * @returns {boolean} - 超過 7 天回傳 true
 */
function isOrderOverdue(timestamp) {
  // 請實作此函式
  const today = dayjs(); //1.
  const orderDay = dayjs.unix(timestamp); // 2.
  const orderDaysAgo = today.diff(dayjs.unix(timestamp), 'day');
  return today.diff(orderDay, 'day') > 7;
}

/**
 * 4. 取得本週的訂單
 * @param {Array} orders - 訂單陣列，每筆訂單有 createdAt 欄位
 * @returns {Array} - 篩選出 createdAt 在本週的訂單
 */
function getThisWeekOrders(orders) {
  // 請實作此函式
  // 提示：
  // 1. 用 dayjs().startOf('week') 取得本週開始
  // 2. 用 dayjs().endOf('week') 取得本週結束
  // 3. 用 .isBefore() 和 .isAfter() 判斷，PS: (在Day.js中還有.isbetween)
  const startOfWeek = dayjs().startOf('week'); // 1.
  const endOfWeek = dayjs().endOf('week');  // 2.
  return orders.filter(order => {
    const orderDay = dayjs.unix(order.createdAt);
    //判斷訂單建立(createdAt) 是否在 本週開始之後 且 在 本週結束之前
    return orderDay.isAfter(startOfWeek) && orderDay.isBefore(endOfWeek);
  });
}

// ========================================
// 任務二：資料驗證（原生 JS 實作）
// ========================================

/**
 * 1. 驗證訂單使用者資料
 * @param {Object} data - { name, tel, email, address, payment }
 * @returns {Object} - { isValid: boolean, errors: string[] }
 *
 * 驗證規則：
 * - name: 不可為空
 * - tel: 必須是 09 開頭的 10 位數字
 * - email: 必須包含 @ 符號
 * - address: 不可為空
 * - payment: 必須是 'ATM', 'Credit Card', 'Apple Pay' 其中之一
 */
function validateOrderUser(data) {
  // 請實作此函式
  const errors = [];
  if (!data.name ||data.name.trim().length === 0) {
    //也不能是空格。
    errors.push('姓名不可為空');
  }
  const telRule = /^09\d{8}$/; 
  // Regex（正則表達式）：^：代表字串的開頭、09：強制比對必須是 09 這兩個數字開頭、\d：代表數字（等同於 [0-9]）、{8}：代表前面的數字必須剛好出現 8 次、$：代表字串的結束。
  if (!telRule.test(data.tel)) {
    errors.push('電話必須是 09 開頭的 10 位數字');
  }
  const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex
  if (!emailRule.test(data.email)) {
    errors.push('Email必須包含 @ 符號');
  }
  if (!data.address ||data.address.trim().length === 0) {
    errors.push('地址不可為空');
  }
  //付款方式必須是上述，用[]包起來再用if篩選要包含上述付款方式。
  const paymentsWay = ['ATM', 'Credit Card', 'Apple Pay'];
  if (!paymentsWay.includes(data.payment)) {
    errors.push('付款方式必須是 ATM, Credit Card, Apple Pay 其中之一');
  };
  //要記得return，包成obj回傳
  return { 
    isValid: errors.length === 0, // 錯誤陣列 = 0 = 沒有錯 = True
    errors: errors 
  };
}

/**
 * 2. 驗證購物車數量
 * @param {number} quantity - 數量
 * @returns {Object} - { isValid: boolean, error?: string }
 *
 * 驗證規則：
 * - 必須是正整數
 * - 不可小於 1
 * - 不可大於 99
 */
function validateCartQuantity(quantity) {
  // 請實作此函式
  // 檢查是否為「整數」
  if (!Number.isInteger(quantity)) {
    return { isValid: false, error: '數量必須是正整數' }
  }
  if (quantity < 1) {
    return { isValid: false, error: '數量不可小於 1' }
  }
  if (quantity > 99) {
    return { isValid: false, error: '數量不可大於 99' }
  };
  // 如果前面的 if 都沒被觸發，代表數字在 1~99 之間且是整數。此時回傳 isValid: true，不需提供 error 訊息。
  return { 
    isValid: true,
  };
}

// ========================================
// 任務三：唯一識別碼（原生 JS 實作）
// ========================================

/**
 * 1. 產生訂單編號
 * @returns {string} - 格式 'ORD-xxxxxxxx'
 */
function generateOrderId() {
  // 請實作此函式
  // 提示：可以用 Date.now().toString(36) + Math.random().toString(36).slice(2)
  // Date.now().toString(36) 會把現在的時間轉換成 36 進位（包含 0-9 與 a-z）
  // Math.random().toString(36).slice(2) 會產生隨機字串並去掉前面的 "0."
  return `ORD-${Date.now().toString(36) + Math.random().toString(36).slice(2)}`
}

/**
 * 2. 產生購物車項目 ID
 * @returns {string} - 格式 'CART-xxxxxxxx'
 */
function generateCartItemId() {
  // 請實作此函式
  return `CART-${Date.now().toString(36) + Math.random().toString(36).slice(2)}`
}

// ========================================
// 任務四：使用 Axios 串接 API
// ========================================

/**
 * 1. 取得產品列表（使用 Axios）
 * @returns {Promise<Array>} - 回傳 products 陣列
 */
async function getProductsWithAxios() {
  // 請實作此函式
  // 提示：axios.get() 會自動解析 JSON，不需要 .json()
  // 回傳 response.data.products
  const response = await axios.get(`${BASE_URL}/api/livejs/v1/customer/${API_PATH}/products`);
  return response.data.products;
}

/**
 * 2. 加入購物車（使用 Axios）
 * @param {string} productId - 產品 ID
 * @param {number} quantity - 數量
 * @returns {Promise<Object>} - 回傳購物車資料
 */
async function addToCartWithAxios(productId, quantity) {
  // 請實作此函式
  // 提示：axios.post(url, data) 會自動設定 Content-Type
  const response = await axios.post(`${BASE_URL}/api/livejs/v1/customer/${API_PATH}/carts`, {
    data: { productId, quantity }
  });
  return response.data
}

/**
 * 3. 取得訂單（使用 Axios，需認證）
 * @returns {Promise<Array>} - 回傳訂單陣列
 */
async function getOrdersWithAxios() {
  // 請實作此函式
  // 提示：axios.get(url, { headers: { authorization: token } })
  const response = await axios.get(
    `${BASE_URL}/api/livejs/v1/admin/${API_PATH}/orders`,
    { headers: { authorization: ADMIN_TOKEN } }
  );
  return response.data.orders;
}

/*
比較題：請說明 fetch 和 axios 的主要差異

1. JSON 資料的自動解析：
fetch：需要手動處理。發送時要用 JSON.stringify() 轉成字串，接收後還要呼叫 .json() 才能解析。
axios：會自動處理 JSON 資料。發送請求時直接傳物件，接收回應時直接拿 response.data 即可。

2. Content-Type 設定 (Header Setting)：
fetch: 當你使用 POST 方法傳送資料時，瀏覽器不知道你傳的是什麼。你必須手動設定 headers: { 'Content-Type': 'application/json' }，否則後端可能收不到資料。
axios: 當你把物件丟進 axios.post() 時，它會自動幫你加上這個標頭，所以不需要手動設定header進去。

3. 錯誤處理 (Error Handling)：
fetch: 它對「錯誤」的定義很寬鬆。即便後端回傳 404 (找不到頁面) 或 500 (伺服器壞了)，fetch 仍會認為「請求成功完成」而進入 .then()。你必須手動檢查 if (!response.ok) 才能捕捉這些錯誤。
axios: 它的邏輯比較直覺。只要 HTTP 狀態碼是 4xx 或 5xx，它就會自動判定為失敗，直接彈到 .catch 區塊，讓你可以統一處理錯誤。

*/

// ========================================
// 任務五：整合應用 (挑戰)
// ========================================

/**
 * 建立一個完整的「訂單服務」物件
 */
const OrderService = {
  apiPath: API_PATH,
  baseURL: BASE_URL,
  token: ADMIN_TOKEN,

  /**
   * 使用 axios 取得訂單
   * @returns {Promise<Array>} - 訂單陣列
   */
  async fetchOrders() {
    // 請實作此函式
    const response = await axios.get(
    `${this.baseURL}/api/livejs/v1/admin/${this.apiPath}/orders`,
    { 
      headers: { authorization: this.token } 
    }
    //${this.baseURL}：表示要使用當前作用域(255-257行)裡的參數，同this.apiPath及this.token
  );
  return response.data.orders;
  },

  /**
   * 使用 dayjs 格式化訂單日期
   * @param {Array} orders - 訂單陣列
   * @returns {Array} - 為每筆訂單加上 formattedDate 欄位 = 用map
   */
  formatOrders(orders) {
    // 請實作此函式
    //1. 先使用 map 遍歷整個 orders 陣列，map 會對陣列中的每一筆訂單（order）執行一次裡面的函式，並最後回傳一個全新的陣列。
    return orders.map(order => {
      // 2. 將訂單的時間轉換為 dayjs 物件
      // order.createdAt 是 Unix Timestamp（秒），dayjs.unix() 能把它轉成 dayjs 可操作的時間格式。
      const orderDate = dayjs.unix(order.createdAt);
      // 3. 回傳一個整合後的新物件，用...order：展開order這個陣列
      return {
        ...order,
        // 5. 新增 formattedDate 屬性，使用 dayjs 的 .format() 方法
        formattedDate: orderDate.format('YYYY-MM-DD HH:mm:ss')
    };
  });
  },

  /**
   * 篩選未付款訂單
   * @param {Array} orders - 訂單陣列
   * @returns {Array} - paid: false 的訂單
   */
  filterUnpaidOrders(orders) {
    // 請實作此函式
    //篩選：用filter，回傳判斷條件。
    return orders.filter(order => {
      return !order.paid;
    })
  },

  /**
   * 驗證訂單使用者資料
   * @param {Object} userInfo - 使用者資料
   * @returns {Object} - 驗證結果
   */
  validateUserInfo(userInfo) {
    return validateOrderUser(userInfo);
  },

  /**
   * 整合：取得未付款訂單，並格式化日期
   * @returns {Promise<Array>} - 格式化後的未付款訂單
   */
  async getUnpaidOrdersFormatted() {
    const orders = await this.fetchOrders();
    const unpaid = this.filterUnpaidOrders(orders);
    return this.formatOrders(unpaid);
  }
};

// ========================================
// 匯出函式供測試使用
// ========================================
module.exports = {
  API_PATH,
  BASE_URL,
  ADMIN_TOKEN,
  formatOrderDate,
  getDaysAgo,
  isOrderOverdue,
  getThisWeekOrders,
  validateOrderUser,
  validateCartQuantity,
  generateOrderId,
  generateCartItemId,
  getProductsWithAxios,
  addToCartWithAxios,
  getOrdersWithAxios,
  OrderService
};

// ========================================
// 直接執行測試
// ========================================
if (require.main === module) {
  // 測試資料
  const testOrders = [
    { id: 'order-1', createdAt: Math.floor(Date.now() / 1000) - 86400 * 3, paid: false },
    { id: 'order-2', createdAt: Math.floor(Date.now() / 1000) - 86400 * 10, paid: true },
    { id: 'order-3', createdAt: Math.floor(Date.now() / 1000), paid: false }
  ];

  async function runTests() {
    console.log('=== 第七週作業測試 ===\n');
    console.log('API_PATH:', API_PATH);
    console.log('');

    // 任務一測試
    console.log('--- 任務一：dayjs 日期處理 ---');
    const timestamp = 1704067200;
    console.log('formatOrderDate:', formatOrderDate(timestamp));
    console.log('getDaysAgo:', getDaysAgo(testOrders[0].createdAt));
    console.log('isOrderOverdue:', isOrderOverdue(testOrders[1].createdAt));
    console.log('getThisWeekOrders:', getThisWeekOrders(testOrders)?.length, '筆');

    // 任務二測試
    console.log('\n--- 任務二：資料驗證 ---');
    const validUser = {
      name: '王小明',
      tel: '0912345678',
      email: 'test@example.com',
      address: '台北市信義區',
      payment: 'Credit Card'
    };
    console.log('validateOrderUser (valid):', validateOrderUser(validUser));

    const invalidUser = {
      name: '',
      tel: '1234',
      email: 'invalid',
      address: '',
      payment: 'Bitcoin'
    };
    console.log('validateOrderUser (invalid):', validateOrderUser(invalidUser));

    console.log('validateCartQuantity (5):', validateCartQuantity(5));
    console.log('validateCartQuantity (0):', validateCartQuantity(0));

    // 任務三測試
    console.log('\n--- 任務三：ID 產生 ---');
    console.log('generateOrderId:', generateOrderId());
    console.log('generateCartItemId:', generateCartItemId());

    // 任務四測試
    if (API_PATH) {
      console.log('\n--- 任務四：Axios API 串接 ---');
      try {
        const products = await getProductsWithAxios();
        console.log('getProductsWithAxios:', products ? `成功取得 ${products.length} 筆產品` : '回傳 undefined');
      } catch (error) {
        console.log('getProductsWithAxios 錯誤:', error.message);
      }
    } else {
      console.log('\n--- 任務四：請先在 .env 設定 API_PATH ---');
    }

    console.log('\n=== 測試結束 ===');
    console.log('\n提示：執行 node test.js 進行完整驗證');
  }

  runTests();
}
