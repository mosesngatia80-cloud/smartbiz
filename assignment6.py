product_name = input("product name")
selling_price = int(input("selling price"))
discount = int(input("discount percentage"))

discount_ammount = selling_price * discount/100
final_price = selling_price - discount_ammount

print(product_name)
print(selling_price)
print(discount)
print(discount_ammount)
print(final_price)
