"""上传项目文件到服务器并部署"""
import paramiko
import os

SERVER = "118.31.34.27"
USER = "root"
PASSWORD = "Pld200501251807."
REMOTE_DIR = "/opt/dormitory-system"

# 需要上传的文件/目录
UPLOAD_ITEMS = [
    "app",
    "scripts",
    "web/src",
    "web/public",
    "web/package.json",
    "web/package-lock.json",
    "web/vite.config.ts",
    "web/tsconfig.json",
    "web/tsconfig.app.json",
    "web/tsconfig.node.json",
    "web/index.html",
    "web/nginx.conf",
    "web/Dockerfile",
    "Dockerfile",
    "docker-compose.prod.yml",
    "requirements.txt",
    "init_db.py",
    ".env.production",
]

# 忽略的目录/文件
IGNORE = {"node_modules", "__pycache__", ".git", "venv", ".env"}

def should_ignore(path):
    parts = path.replace("\\", "/").split("/")
    return any(p in IGNORE for p in parts)

def upload_file(sftp, local_path, remote_path):
    try:
        sftp.put(local_path, remote_path)
        print(f"  上传: {local_path}")
    except Exception as e:
        print(f"  失败: {local_path} - {e}")

def upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)

    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"

        if should_ignore(local_path):
            continue

        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            upload_file(sftp, local_path, remote_path)

def main():
    local_base = os.path.dirname(os.path.abspath(__file__))

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"连接 {SERVER}...")
    ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=10)
    print("SSH连接成功!")

    sftp = ssh.open_sftp()

    # 创建远程目录
    try:
        sftp.stat(REMOTE_DIR)
    except FileNotFoundError:
        sftp.mkdir(REMOTE_DIR)

    # 上传文件
    print("\n开始上传文件...")
    for item in UPLOAD_ITEMS:
        local_path = os.path.join(local_base, item)
        remote_path = f"{REMOTE_DIR}/{item}"

        if not os.path.exists(local_path):
            print(f"  跳过(不存在): {item}")
            continue

        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            # 确保远程目录存在
            remote_dir = os.path.dirname(remote_path)
            try:
                sftp.stat(remote_dir)
            except FileNotFoundError:
                # 递归创建目录
                parts = remote_dir.split("/")
                current = ""
                for part in parts:
                    if part:
                        current += "/" + part
                        try:
                            sftp.stat(current)
                        except FileNotFoundError:
                            sftp.mkdir(current)

            upload_file(sftp, local_path, remote_path)

    sftp.close()

    # 执行部署命令
    print("\n开始部署...")
    commands = [
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml down",
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml up -d --build",
    ]

    for cmd in commands:
        print(f"\n执行: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out.strip():
            print(out.strip())
        if err.strip():
            print(err.strip())

    # 获取服务器IP
    stdin, stdout, stderr = ssh.exec_command("curl -s ifconfig.me", timeout=10)
    server_ip = stdout.read().decode().strip()

    ssh.close()

    print(f"\n=== 部署完成 ===")
    print(f"访问: http://{server_ip}")
    print(f"邀请码: dorm2026 或 test123")

if __name__ == "__main__":
    main()
