import urllib.request
ids = [
    "photo-1522708323590-d24dbb6b0267", 
    "photo-1560448204-e02f11c3d0e2", # Real estate apartment
    "photo-1497366216548-37526070297c",
    "photo-1600607687931-cebf00330fce", # This is the broken one
    "photo-1570129477492-45c003edd2be", # House
    "photo-1512917774080-9991f1c4c750", # Modern villa
    "photo-1494526585095-c1b70ce3658f" # Ocean view house
]
for i in ids:
    url = f"https://images.unsplash.com/{i}?auto=format&fit=crop&w=800&q=80"
    try:
        urllib.request.urlopen(url)
        print(f"Works: {url}")
    except Exception as e:
        print(f"Fails: {url} - {e}")
