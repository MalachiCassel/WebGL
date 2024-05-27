from dotenv import load_dotenv
load_dotenv

import os
from supabase import create_client


url = "https://ubmnqlpbepyvcporjffv.supabase.co"
key= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibW5xbHBiZXB5dmNwb3JqZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1Nzc2OTcsImV4cCI6MjAzMjE1MzY5N30.RnxNs-8LPBJlcgZNE7UBF76u6VMwbes5ikuae3ucKM8"
supabase = create_client(url, key)

data = supabase.table('tutorial').select("*").execute()
print("data before login ",data)

users_email:str="malachicassel@gmail.com"
users_password:str="w34ref4rgetw"
user = supabase.auth.sign_in_with_password({ "email": users_email, "password": users_password })
#print(user)

data = supabase.table('tutorial').select("*").execute()
print("data after login ",data)

supabase.auth.sign_out()