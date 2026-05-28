"""远程部署脚本"""
import paramiko

SERVER = "118.31.34.27"
USER = "root"
PASSWORD = "Pld200501251807."

def run_cmd(ssh, cmd, timeout=30):
    print(f"执行: {cmd[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip() and "WARNING" not in err:
        print(f"ERR: {err.strip()}")
    return out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"连接 {SERVER}...")
    ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=10)
    print("SSH连接成功!")

    # 检查Docker
    run_cmd(ssh, "docker --version")

    # 安装 docker-compose 插件
    run_cmd(ssh, "docker compose version || (mkdir -p /usr/local/lib/docker/cli-plugins && curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose)")

    # 创建项目目录
    run_cmd(ssh, "mkdir -p /opt/dormitory-system")

    # 创建 .env 文件
    env_content = """DATABASE_URL=mysql+mysqlconnector://recon_user:Recon%402026@mysql.xyyxt.xyz:3306/reconciliation_system
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=false
JWT_SECRET_KEY=dormitory-autonomy-secret-key-2026
REDIS_URL=
DB_PASSWORD=unused
PORT=80
"""
    run_cmd(ssh, f"cat > /opt/dormitory-system/.env << 'ENVEOF'\n{env_content}ENVEOF")

    print("\n服务器基础环境准备完成!")
    print("接下来需要上传项目文件到 /opt/dormitory-system/")
    ssh.close()

if __name__ == "__main__":
    main()
