import urllib.request
ids = [
    "photo-1499793983690-e29da59ef1c2", # beach house
    "photo-1515263487990-61b07816b324", # balcony
    "photo-1520250497591-112f2f40a3f4", # resort ocean view
    "photo-1580587771525-78b9dba3b914", # modern mansion
    "photo-1512917774080-9991f1c4c750" # modern villa
]
for i in ids:
    url = f"https://images.unsplash.com/{i}?auto=format&fit=crop&w=800&q=80"
    try:
        urllib.request.urlopen(url)
        print(f"Works: {url}")
    except Exception as e:
        print(f"Fails: {url} - {e}")
