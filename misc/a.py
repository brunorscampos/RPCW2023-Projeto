import json

def create_html_table(json_list, common_attribute):
    # Extract all attributes from the JSON list
    attributes = []
    for element in json_list:
        attributes += element.keys()
        
    attributes = list(set(attributes))
    attributes.remove(common_attribute)

    # Create a table row for each element
    table_rows = []
    for element in json_list:
        row_data = [element.get(common_attribute, "")]
        for attr in attributes:
            row_data.append("X" if attr in element else "")
        table_rows.append(row_data)
    
    attr_counts = {attr: sum(1 for row in table_rows if row[attributes.index(attr) + 1] == "X") for attr in attributes}
    sorted_attributes = sorted(attr_counts.keys(), key=lambda x: attr_counts[x], reverse=True)
    
    sorted_table_rows = []
    for row in table_rows:
        sorted_row = [row[0]]
        for attr in sorted_attributes:
            sorted_row.append(row[attributes.index(attr) + 1])
        sorted_table_rows.append(sorted_row)
    
    table = ""
    table += f"<tr><th>{common_attribute}</th>"
    for attr in sorted_attributes:
        table += f"<th>{attr}</th>"
    table += "</tr>"
    for row in sorted_table_rows:
        table += "<tr>"
        for val in row:
            table += f"<td>{val}</td>"
        table += "</tr>"
    
    # Combine the header row and element rows into an HTML table
    html_table = '<!DOCTYPE html><html><head><title>Table</title><meta charset="utf-8"/><link rel="stylesheet" href="public/stylesheets/w3.css"/></head><body>'
    html_table += f'<div class="w3-container" style="overflow:auto;"><table class="w3-table-all">{table}</table></div>'
    html_table += '</body></html>'
    return html_table

# Example usage
with open("example_entries.json","r") as f:
    json_list = json.load(f)

common_attribute = 'tribunal'
html_table = create_html_table(json_list, common_attribute)

with open("table.html","w") as f:
    f.write(html_table)
