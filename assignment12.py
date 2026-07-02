customer = input("customer name")
product = input("product name")
price_per_item = int(input("price per item"))
quantity = int(input("quantity"))

subtotal = price_per_item * quantity
VAT = subtotal * 16/100
grandtotal = subtotal + VAT

print("customer:",customer)
print("product name:",product)
print("price:", price_per_item)
print("Quantity:",quantity)
print("Sub Total:",subtotal)
print("VAT (16%):",VAT)
print("Grand Total:",grandtotal)
if grandtotal > 100000:
   print("VIP Customer")
else:
  print("Regular Customer")
