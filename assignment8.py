balance = int(input("bank balance"))

if balance >= 10000:
   print("Gold Customer")
elif balance >= 5000:
   print("Silver Customer")
elif balance >= 1000:
   print("Bronze Customer")
else:
   print("Low Balance")

