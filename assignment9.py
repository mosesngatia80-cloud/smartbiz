purchase = int(input("enter purchase ammount"))

if purchase >= 10000:
   print(purchase * 20/100)
elif purchase >= 5000:
   print(purchase * 10/100)
elif purchase >= 1000:
   print(purchase * 5/100)
else:
   print("No discount")
   print(purchase)
  
