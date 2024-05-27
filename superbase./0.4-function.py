from dotenv import load_dotenv
load_dotenv

import os
from supabase import create_client

import asyncio


url = "https://ubmnqlpbepyvcporjffv.supabase.co"
key= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibW5xbHBiZXB5dmNwb3JqZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1Nzc2OTcsImV4cCI6MjAzMjE1MzY5N30.RnxNs-8LPBJlcgZNE7UBF76u6VMwbes5ikuae3ucKM8"
supabase = create_client(url, key)
func=supabase.functions()

async def test_func():
    resp=await func.invoke("hello-world",invoke_option={'body':{"malachi"}})
    return resp

loop=asyncio.new_event_loop()
resp=loop.run_until_complete(test_func())
print(resp)
loop.close()
