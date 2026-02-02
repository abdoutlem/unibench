from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)

driver.get("https://nces.ed.gov/ipeds/datacenter/FacsimileView.aspx?surveyNumber=9&unitId=166683&year=2021")

# Wait until at least one input appears
WebDriverWait(driver, 20).until(
    EC.presence_of_element_located((By.TAG_NAME, "input"))
)

inputs = driver.find_elements(By.TAG_NAME, "input")

for inp in inputs:
    print(
        inp.get_attribute("name"),
        inp.get_attribute("type"),
        inp.get_attribute("value")
    )

driver.quit()
