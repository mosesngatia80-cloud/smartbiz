name = input("enter product name")
buying_price = int(input("buying price"))
selling_price = int(input("selling price"))

profit = selling_price - buying_price

if  profit > 0:
   print("This product is profitable")
else:
   print("This product is not profitable")
