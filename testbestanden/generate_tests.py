import json
import math, random
from datetime import date, timedelta

# -------------------------------------------------
# Basisinstellingen
# -------------------------------------------------

TODAY = date.today()

bsn_start=999900000
aantal = 500

def random_past_date(start_year: int = 2018) -> date:
    """
    Genereert een willekeurige datum in het verleden.
    """
    start = date(start_year, 1, 1)
    delta_days = (TODAY - start).days
    return start + timedelta(days=random.randint(0, delta_days))

def date_str(d: date) -> str:
    """
    Zet een date om naar YYYY-MM-DD string.
    """
    return d.isoformat()

def neemmee(kans: int = 5) -> bool:
    """
    Bepaalt of stukje code wel of niet meegenomen wordt. Eventueel kans 1-10 meegeven.
    """
    return (random.random() * 11 < kans)

def generate_geboortedatum() -> str:
    """
    Genereer een geboortedatum zodat de client tussen de 18 en 70 is
    """
    datum = random_past_date(int(TODAY.year)-65)    # willekeurige datum in afgelopen 65 jaar
    datum = datum - timedelta(days=6600)            # trek daar 6600 dagen (ongeveer 18 jaar) af
    return date_str(datum)

def generate_postcode() -> str:
    """
    Genereer een postcode in de vorm 1234AB
    """
    postcode = random.randint(1000, 9999)     # Maak een getal van 4 cijfers, waarvan de eerste minstens 1 is
    postcode = str(postcode) + chr(random.randint(ord('A'), ord('Z'))) + chr(random.randint(ord('A'), ord('Z'))) # voeg daar 2 random hoofdletters aan toe
    return postcode

# BSN bepalen met een paar hulpfuncties

def is_elfproef_bsn(n: int) -> bool:
    s = str(n)
    if len(s) != 9:
        return False
    if s[0] == '0':
        return False
    if len(set(s)) == 1:  # niet alle cijfers gelijk
        return False

    total = 0
    for i, digit in enumerate(s):
        weight = 9 - i
        if weight == 1:
            weight = -1
        total += int(digit) * weight

    return total % 11 == 0

def kies_bsn(
    bsn_gen,
    eerder_gebruikte_bsns: list[str],
    verboden_bsns: set[str],
    hergebruik_kans: float = 0.03
) -> str:
    """
    Geeft meestal een nieuw BSN terug, maar hergebruikt soms een eerder gebruikt BSN.
    verboden_bsns bevat BSN's die binnen hetzelfde traject al gebruikt zijn.
    hergebruik_kans=0.03 betekent ongeveer 3% kans op hergebruik.
    """

    herbruikbare_bsns = [
        bsn for bsn in eerder_gebruikte_bsns
        if bsn not in verboden_bsns
    ]

    if herbruikbare_bsns and random.random() < hergebruik_kans:
        return random.choice(herbruikbare_bsns)

    nieuw_bsn = next(bsn_gen)
    eerder_gebruikte_bsns.append(nieuw_bsn)
    return nieuw_bsn

def next_bsn(n: int, elf_proef: bool) -> int:
    candidate = n
    while True:
        if is_elfproef_bsn(candidate) or not elf_proef:
            return candidate
        candidate += 1

def bsn_generator(start: int, elf_proef: bool):
    current = start

    while True:
        bsn = next_bsn(current, elf_proef)
        yield str(bsn)
        current = bsn + 1

# -------------------------------------------------
# Client
# -------------------------------------------------
def generate_clnt(bsn: str) -> dict:
    geslachten = ["M", "V", "O"]
    return {
        "Burgerservicenummer": bsn,
        "Geboortedatum": generate_geboortedatum(),
        "Geslachtsaanduiding": random.choice(geslachten),
        "Postcode": generate_postcode(),
        "Huisnummer": str(random.randint(1, 250))
    }

def generate_client(
    bsn_gen,
    eerder_gebruikte_bsns: list[str],
    hergebruik_kans: float = 0.03
) -> list[dict]:

    bsn_in_traject = set()

    bsn = kies_bsn(
        bsn_gen=bsn_gen,
        eerder_gebruikte_bsns=eerder_gebruikte_bsns,
        verboden_bsns=bsn_in_traject,
        hergebruik_kans=hergebruik_kans
    )

    bsn_in_traject.add(bsn)
    cl = [generate_clnt(bsn)]

    if neemmee(8):
        bsn = kies_bsn(
            bsn_gen=bsn_gen,
            eerder_gebruikte_bsns=eerder_gebruikte_bsns,
            verboden_bsns=bsn_in_traject,
            hergebruik_kans=hergebruik_kans
        )

        bsn_in_traject.add(bsn)
        cl.append(generate_clnt(bsn))

    return cl

# -------------------------------------------------
# Begeleiding
# -------------------------------------------------

def generate_begeleiding(start: date) -> list[dict]:
    """
    Genereert 1 afgeronde begeleiding + optioneel 1 lopende.
    """
    begeleiding = []

    start1 = start + timedelta(days=30)
    end1 = start1 + timedelta(days=180)

    begeleiding.append({
        "soort": "Budgetcoaching",
        "startdatum": date_str(start1),
        "einddatum": date_str(end1)
    })

    # Optioneel lopende begeleiding
    if neemmee(5):
        begeleiding.append({
            "soort": "Budgetbeheer",
            "startdatum": date_str(end1 + timedelta(days=1))
        })

    return begeleiding

# -------------------------------------------------
# Schuldhulptraject
# -------------------------------------------------

def generate_traject(
    gemeentecode: str,
    variant: str,
    bsn_gen,
    eerder_gebruikte_bsns: list[str],
    hergebruik_kans: float = 0.03
) -> dict:

    start = random_past_date(2024)

    traject = {
        "gemeentecode": gemeentecode,
        "client": generate_client(
            bsn_gen=bsn_gen,
            eerder_gebruikte_bsns=eerder_gebruikte_bsns,
            hergebruik_kans=hergebruik_kans
        ),
        "startdatum": date_str(start)
    }

    # Minimale variant
    if variant == "minimal":
        return traject

    # Aanmelding
    if neemmee(9):
        traject["aanmelding"] = {
            "crisisinterventie": variant == "crisis",
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start - timedelta(days=3))
        }

    # Intake
    if neemmee(8):
        traject["intake"] = {
            "startdatum": date_str(start + timedelta(days=5)),
            "einddatum": date_str(start + timedelta(days=25)),
            "beschikkingsdatum": date_str(start + timedelta(days=27)),
            "beschikkingssoort": (
                "Afwijzingsbeschikking"
                if variant == "afwijzing"
                else "Toelatingsbeschikking"
            )
        }

    # crisisinterventies
    if neemmee(1):
        traject["crisisinterventies"] = [];
        traject["crisisinterventies"].append({
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start - timedelta(days=3))
        })

    # moratoria
    if neemmee(1):
        traject["moratoria"] = [];
        traject["moratoria"].append({
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start - timedelta(days=3)),
            "datumAanvraag": date_str(start - timedelta(days=2))
        })

    # planVanAanpak
    if neemmee():
        traject["planVanAanpak"] = {
            "datumAfronding": date_str(start + timedelta(days=15))
        }

    # stabilisatie
    if neemmee():
        traject["stabilisatie"] = {
            "startdatum": date_str(start + timedelta(days=3)),
            "einddatum": date_str(start + timedelta(days=30))
        }

    # schuldregeling
    if neemmee():
        traject["schuldregeling"] = {
            "datum": date_str(start + timedelta(days=65))
        }

    # nazorg
    if neemmee():
        traject["nazorg"] = {
            "startdatum": date_str(start + timedelta(days=85)),
            "einddatum": date_str(start + timedelta(days=120))
        }

    # informatieEnAdvies
    if neemmee(2):
        traject["informatieEnAdvies"] = {
            "startdatum": date_str(start + timedelta(days=5)),
            "einddatum": date_str(start + timedelta(days=90))
        }

    # Begeleiding
    if variant in ["lopend", "afgerond", "crisis"]:
        traject["begeleiding"] = generate_begeleiding(start)

    # Afgerond traject
    if variant == "afgerond":
        end = start + timedelta(days=random.randint(40, 500))
        traject["einddatum"] = date_str(end)

        traject["oplossing"] = {
            "soort": "Schuldbemiddeling",
            "startdatum": date_str(start + timedelta(days=120)),
            "einddatum": date_str(end),
            "vtlb": random.randint(1000, 1400)
        }

        traject["uitstroom"] = {
            "datum": date_str(end),
            "reden": "Afgerond"
        }

    # Afwijzing
    if variant == "afwijzing":
        traject["uitstroom"] = {
            "datum": date_str(start + timedelta(days=40)),
            "reden": "Niet passend"
        }

    return traject

# -------------------------------------------------
# Levering
# -------------------------------------------------

def generate_levering(
    teller: int,
    elf_proef: bool,
    aantal_trajecten: int,
    hergebruik_kans: float = 0.03
) -> dict:

    variants = ["minimal", "lopend", "afgerond", "afgerond", "afgerond", "afwijzing", "crisis"]
    gemeentecodes = ["0503", "0599", "0518", "0546"]

    bsn_gen = bsn_generator(bsn_start, elf_proef)
    eerder_gebruikte_bsns = []

    schuldhulptrajecten = []

    for _ in range(aantal_trajecten):
        schuldhulptrajecten.append(
            generate_traject(
                gemeentecode=random.choice(gemeentecodes),
                variant=random.choice(variants),
                bsn_gen=bsn_gen,
                eerder_gebruikte_bsns=eerder_gebruikte_bsns,
                hergebruik_kans=hergebruik_kans
            )
        )

    return {
        "teller": teller,
        "aanleverende_organisatie": {
            "(Statutaire) Naam": f"Testorganisatie {teller}",
            "KvK-nummer": f"{10000000 + teller}",
            "postcode": "1234AB",
            "gemeentecode": random.choice(gemeentecodes),
            "contactpersonen": [
                {
                    "naam": "Test Contact",
                    "functietitel": "Tester",
                    "email": f"test{teller}@example.nl",
                    "telefoonnummer": "0612345678"
                }
            ]
        },
        "schuldhulptrajecten": schuldhulptrajecten
    }

# -------------------------------------------------
# Eindbestand
# -------------------------------------------------

data = {
    "startdatumLevering": "2025-07-01",
    "einddatumLevering": "2025-12-31",
    "aanleverdatumEnTijd": "2026-06-12T10:30:00Z",
    "codeGegevensleverancier": "TEST-LEVERANCIER-001",
    "leveringen": [
        # Levering 1: BSN 900000000 – 900000099
        generate_levering(
            teller=1,
            elf_proef=True,
            aantal_trajecten=750,
            hergebruik_kans=0.03
        )
        # Levering 2: overlap BSN 900000050 – 900000149 [even geen 2e levering, werkt toch niet in invoerapp]
#        generate_levering(
#            teller=2,
#            bsn_start=900000090,
#            aantal_trajecten=100
#        )
    ]
}

# -------------------------------------------------
# Wegschrijven naar bestand
# -------------------------------------------------

output_path = "testbestand_schuldhulpverlening_" + TODAY.strftime("%Y%m%d") + ".json"

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Testbestand gegenereerd: {output_path}")
