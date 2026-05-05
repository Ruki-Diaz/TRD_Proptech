import urllib.request
ids = [
    "photo-1600596542815-ffad4c1539a9",
    "photo-1600585154526-990dced4ea0d",
    "photo-1512917774080-9991f1c4c750",
    "photo-1600607688969-a5bfcd64bd15",
    "photo-1600566752355-35792bedcfea",
    "photo-1449844908441-8829872d2607",
    "photo-1448630360428-65456885c650",
    "photo-1510798831971-661eb04b3739",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1502672260266-1c1de2d96674",
    "photo-1493809842364-78817add7ffb",
    "photo-1500382017468-9049fed747ef",
    "photo-1507525428034-b723cf961d3e",
    "photo-1519046904884-53103b34b206",
    "photo-1464822759023-fed622ff2c3b",
    "photo-1600585154340-be6161a56a0c",
    "photo-1497366216548-37526070297c",
    "photo-1497366754035-f200968a6e72",
    "photo-1524758631624-e2822e304c36"
]
for i in ids:
    url = f"https://images.unsplash.com/{i}?auto=format&fit=crop&w=800&q=80"
    try:
        urllib.request.urlopen(url)
        print(f"Works: {url}")
    except Exception as e:
        print(f"Fails: {url} - {e}")
