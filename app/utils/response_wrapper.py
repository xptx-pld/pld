"""
Global response wrapper for unified API response format.
All API responses must follow this structure.
"""

from typing import Optional, Any, Dict, List, Union


class ResponseWrapper:
    """统一响应包装器"""

    @staticmethod
    def success(
        data: Union[Dict, List, Any] = None,
        message: str = "操作成功",
        code: int = 200
    ) -> Dict:
        """
        构造成功响应

        Args:
            data: 返回的数据
            message: 状态消息
            code: 状态码

        Returns:
            标准响应字典
        """
        return {
            "code": code,
            "message": message,
            "data": data if data is not None else {}
        }

    @staticmethod
    def error(
        message: str = "操作失败",
        code: int = 500,
        data: Optional[Any] = None
    ) -> Dict:
        """
        构造错误响应

        Args:
            message: 错误信息
            code: 错误状态码
            data: 额外数据

        Returns:
            标准错误响应字典
        """
        return {
            "code": code,
            "message": message,
            "data": data if data is not None else {}
        }

    @staticmethod
    def client_error(message: str) -> Dict:
        """客户端参数错误 (400)"""
        return ResponseWrapper.error(message=message, code=400)

    @staticmethod
    def unauthorized(message: str = "未授权") -> Dict:
        """未授权 (401)"""
        return ResponseWrapper.error(message=message, code=401)

    @staticmethod
    def forbidden(message: str = "权限不足") -> Dict:
        """权限不足 (403)"""
        return ResponseWrapper.error(message=message, code=403)

    @staticmethod
    def not_found(message: str = "资源不存在") -> Dict:
        """资源不存在 (404)"""
        return ResponseWrapper.error(message=message, code=404)

    @staticmethod
    def server_error(message: str = "服务端系统内部异常") -> Dict:
        """服务器异常 (500)"""
        return ResponseWrapper.error(message=message, code=500)
