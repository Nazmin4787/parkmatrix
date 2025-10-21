import subprocess
import sys

# Run makemigrations and provide automated responses
proc = subprocess.Popen(
    [sys.executable, 'manage.py', 'makemigrations'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

# Provide responses for multiple fields that need defaults
# Option 1 (provide default), then '' for each field
responses = "1\n''\n1\n''\n1\n''\n"
output, _ = proc.communicate(input=responses)
print(output)
