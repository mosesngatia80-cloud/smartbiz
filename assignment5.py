product_name = input("product name")
buying_price = int(input("buying price"))
selling_price = int(input("selling price"))
quantity = int(input("quantity"))

profit_per_item = selling_price - buying_price
total_profit = profit_per_item * quantity

if total_profit > 0:
   print(product_name)
   print(total_profit)
   print("Business making money")
else:
   print("Business making loss")
