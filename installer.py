import os

def instalar_dependencias():
    os.system("pip install -r requirements.txt")
    print("Dependencias instaladas")

if __name__ == "__main__":
    instalar_dependencias()