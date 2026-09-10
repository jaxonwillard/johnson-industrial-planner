@echo off
rem Serves the Warehouse folder (so the planner can link the source PDFs) with no-cache headers,
rem and opens the planner hub in your default browser.
cd /d "%~dp0"
python serve.py 8080
