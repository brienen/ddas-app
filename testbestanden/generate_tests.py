import json
import math, random
from datetime import date, timedelta

# -------------------------------------------------
# Basisinstellingen
# -------------------------------------------------

TODAY = date.today()

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

# -------------------------------------------------
# Stukje code om elfproef getallen te genereren
# -------------------------------------------------
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

def next_bsn(n: int) -> int:
    candidate = n + 1
    while True:
        if is_elfproef_bsn(candidate):
            return candidate
        candidate += 1

# -------------------------------------------------
# Client
# -------------------------------------------------

def generate_client(bsn: str) -> dict:
    geslachten = ["M", "V", "O"]
    return {
        "Burgerservicenummer": bsn,
        "Geboortedatum": "1982-05-23",
        "Geslachtsaanduiding": random.choice(geslachten),
        "Postcode": "2611 TV",
        "Huisnummer": "55"
    }

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
    if random.random() < 0.5:
        begeleiding.append({
            "soort": "Budgetbeheer",
            "startdatum": date_str(end1 + timedelta(days=1))
        })

    return begeleiding

# -------------------------------------------------
# Schuldhulptraject
# -------------------------------------------------

def generate_traject(bsn: str, gemeentecode: str, variant: str) -> dict:
    """
    Genereert één schuldhulptraject volgens een variant.
    """
    start = random_past_date()

    traject = {
        "gemeentecode": gemeentecode,
        "client": [generate_client(bsn)],
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
    if neemmee(9):
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

    # planVanAanpak
    if neemmee():
        traject["planVanAanpak"] = {
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start - timedelta(days=3))
        }

    # stabilisatie
    if neemmee():
        traject["stabilisatie"] = {
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start - timedelta(days=3))
        }

    # schuldregeling
    if neemmee():
        traject["schuldregeling"] = {
            "datum": date_str(start - timedelta(days=15))
        }

    # nazorg
    if neemmee():
        traject["nazorg"] = {
            "startdatum": date_str(start - timedelta(days=15)),
            "einddatum": date_str(start + timedelta(days=90))
        }

    # Begeleiding
    if variant in ["lopend", "afgerond", "crisis"]:
        traject["begeleiding"] = generate_begeleiding(start)

    # Afgerond traject
    if variant == "afgerond":
        end = start + timedelta(days=500)
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
    bsn_start: int,
    aantal_trajecten: int
) -> dict:
    variants = ["minimal", "lopend", "afgerond", "afwijzing", "crisis"]
    gemeentecodes = ["0503", "0599", "0518", "0546"]

    return {
        "teller": teller,
        "aanleverende_organisatie": {
            "(Statutaire) Naam": f"Testorganisatie {teller}",
            "KvK-nummer": f"{10000000 + teller}",
            "postcode": "1234AB",
            "gemeentecode": random.choice(variants),
            "contactpersonen": [
                {
                    "naam": "Test Contact",
                    "functietitel": "Tester",
                    "email": f"test{teller}@example.nl",
                    "telefoonnummer": "0612345678"
                }
            ]
        },
        "schuldhulptrajecten": [
            generate_traject(
                bsn=str(next_bsn(bsn_start + 12*i)),
                gemeentecode = random.choice(gemeentecodes),
                variant=random.choice(variants)
            )
            for i in range(aantal_trajecten)
        ]
    }

# -------------------------------------------------
# Eindbestand
# -------------------------------------------------

data = {
    "startdatumLevering": "2025-01-01",
    "einddatumLevering": "2025-12-31",
    "aanleverdatumEnTijd": "2026-01-15T10:30:00Z",
    "codeGegevensleverancier": "TEST-LEVERANCIER-001",
    "leveringen": [
        # Levering 1: BSN 900000000 – 900000099
        generate_levering(
            teller=1,
            bsn_start=900000004,
            aantal_trajecten=572
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

output_path = "testbestand_schuldhulpverlening.json"

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Testbestand gegenereerd: {output_path}")
