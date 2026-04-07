import re
import zipfile
from xml.etree import ElementTree as ET


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _column_index(cell_reference):
    match = re.match(r"([A-Z]+)", cell_reference or "")
    if not match:
        return 0

    value = 0
    for char in match.group(1):
        value = (value * 26) + (ord(char) - 64)
    return value - 1


def _read_shared_strings(archive):
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    strings = []
    for item in root.findall("a:si", NS):
        text = "".join(node.text or "" for node in item.iterfind(".//a:t", NS))
        strings.append(text)
    return strings


def read_first_sheet_rows(file_path):
    with zipfile.ZipFile(file_path) as archive:
        shared_strings = _read_shared_strings(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        first_sheet = workbook.find("a:sheets/a:sheet", NS)
        relationship_id = first_sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]

        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = None
        for rel in rels:
            if rel.attrib.get("Id") == relationship_id:
                target = rel.attrib["Target"]
                break

        if target is None:
            raise ValueError("Unable to resolve worksheet path from workbook relationships.")

        sheet = ET.fromstring(archive.read(f"xl/{target}"))
        rows = []
        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values = []
            cells = row.findall("a:c", NS)
            for cell in cells:
                index = _column_index(cell.attrib.get("r", ""))
                while len(values) <= index:
                    values.append(None)

                value_node = cell.find("a:v", NS)
                if value_node is None:
                    values[index] = None
                    continue

                raw_value = value_node.text
                if cell.attrib.get("t") == "s":
                    values[index] = shared_strings[int(raw_value)]
                else:
                    values[index] = raw_value
            rows.append(values)

        return rows
