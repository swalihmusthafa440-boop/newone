import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

private_key = ec.generate_private_key(ec.SECP256R1())

private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

public_key = private_key.public_key().public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint
)

public_key_base64 = base64.urlsafe_b64encode(
    public_key
).decode("utf-8").rstrip("=")

print("PRIVATE KEY:")
print(private_pem.decode())

print("\nPUBLIC KEY:")
print(public_key_base64)