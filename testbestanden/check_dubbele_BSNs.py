import json
from collections import Counter

# Vervang 'jouw_bestand.json' door de juiste bestandsnaam
with open('testbestand_schuldhulpverlening_20260612.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

bsn_lijst = []

# Loop door alle leveringen en schuldhulptrajecten om de BSN's te verzamelen
for levering in data.get('leveringen', []):
    for traject in levering.get('schuldhulptrajecten', []):
        for client in traject.get('client', []):
            bsn = client.get('Burgerservicenummer')
            if bsn:
                bsn_lijst.append(bsn)

# Tel hoe vaak elk BSN voorkomt
telling = Counter(bsn_lijst)
dubbele_bsns = {bsn: aantal for bsn, aantal in telling.items() if aantal > 1}

# Toon de resultaten
if dubbele_bsns:
    print("Dubbele BSN's gevonden:")
    for bsn, aantal in dubbele_bsns.items():
        print(f"BSN: {bsn} komt {aantal} keer voor.")
else:
    print("Geen dubbele BSN's gevonden.")
