import React, { useState, useEffect } from 'react';
import { healthAPI } from '@/services/api';

const Test: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('检测中...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await healthAPI.check();
        setApiStatus('✅ 后端连接正常');
        console.log('API响应:', response);
      } catch (err: any) {
        setApiStatus('❌ 后端连接失败');
        setError(err.message || '未知错误');
        console.error('API错误:', err);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">API连接测试</h1>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">后端状态:</h2>
          <p className={`text-lg ${apiStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {apiStatus}
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-2">
              错误详情: {error}
            </p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">前端状态:</h2>
          <p className="text-green-600 text-lg">✅ 前端运行正常</p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">API配置:</h2>
          <p className="text-sm text-gray-600">
            后端地址: http://localhost:3001/api
          </p>
        </div>
      </div>
    </div>
  );
};

export default Test;