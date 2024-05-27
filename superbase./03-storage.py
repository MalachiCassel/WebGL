from dotenv import load_dotenv
load_dotenv

import os
from supabase import create_client


url = "https://ubmnqlpbepyvcporjffv.supabase.co"
key= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibW5xbHBiZXB5dmNwb3JqZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1Nzc2OTcsImV4cCI6MjAzMjE1MzY5N30.RnxNs-8LPBJlcgZNE7UBF76u6VMwbes5ikuae3ucKM8"
supabase = create_client(url, key)

# response=supabase.storage().from_("image-bucket").get_public_url("IMG_5598.jpg")
# print(response)


with open(~Desktop, 'rb') as f:
    supabase.storage.from_("testbucket").upload(file=f,path=path_on_supastorage, file_options={"content-type": "audio/mpeg"})
