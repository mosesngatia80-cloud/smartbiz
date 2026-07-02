customer_name = input("customer name")
product_name = input("product name")
price_per_item = int(input("price per item"))
quantity = int(input("quantity"))


total_sale = price_per_item * quantity


if total_sale >= 10000:
    discount = total_sale * 20/100
    final_ammount = total_sale - discount
    discount_ammount = total_sale - final_ammount
    print("customer_name:",customer_name)
    print("product name:",product_name)
    print("price:",price_per_item)
    print("quantity:",quantity)
    print("Total sales:",total_sale)
    print("discount:20%")
    print("discount ammount:",discount_ammount)
    print("final ammount:",final_ammount)
elif total_sale >= 5000:
    discount = total_sale * 10/100
    final_ammount = total_sale - discount
    discount_ammount = total_sale - final_ammount
    print("customer_name:",customer_name)
    print("product name:",product_name)
    print("price:",price_per_item)
    print("quantity:",quantity)
    print("Total sales:",total_sale)
    print("discount:20%")
    print("discount ammount:",discount_ammount)
    print("final ammount:",final_ammount)
elif total_sale >= 1000:
    discount = total_sale * 5/100
    final_ammount = total_sale - discount
    discount_ammount = total_sale - final_ammount
    print("customer_name:",customer_name)
    print("product name:",product_name)
    print("price:",price_per_item)
    print("quantity:",quantity)
    print("Total sales:",total_sale)
    print("discount:20%")
    print("discount ammount:",discount_ammount)
    print("final ammount:",final_ammount)
else:
    print("customer_name:",customer_name)
    print("product name:",product_name)
    print("price:",price_per_item)
    print("quantity:",quantity)
    print("Total sales:",total_sale)
    print("No discount")
