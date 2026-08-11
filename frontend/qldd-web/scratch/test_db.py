import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:5023/api/v1"

def api_call(path, method="GET", headers=None, data=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, method=method, headers=req_headers, data=req_data)
    try:
        with urllib.request.urlopen(req) as res:
            res_data = res.read().decode("utf-8")
            return res.status, json.loads(res_data)
    except urllib.error.HTTPError as e:
        err_data = e.read().decode("utf-8")
        return e.code, err_data

def inspect_db():
    # 1. Login as admin
    status, login_res = api_call("/auth/login", method="POST", data={
        "username": "admin",
        "password": "admin123"
    })
    if status != 200:
        print("Admin login failed:", login_res)
        return
    token = login_res["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get all accounts
    print("\n--- ACCOUNTS ---")
    status, accounts_res = api_call("/accounts", headers=headers)
    accounts = accounts_res["data"]
    for acc in accounts:
        print(f"Username: {acc['username']}")
        print(f"  Role: {acc['vaiTro']}")
        print(f"  HoTen: {acc['hoTen']}")
        print(f"  OrgId: {acc['organizationId']}")
        print(f"  PasswordRaw: {acc['passwordRaw']}")

    # 3. Get all union units (tree format, flatten it)
    print("\n--- UNION UNITS ---")
    status, tree_res = api_call("/union-units/tree", headers=headers)
    
    def flatten_tree(node):
        units = [{
            "id": node["id"],
            "name": node["tenDonVi"],
            "type": node["loaiToChuc"],
            "level": node["level"],
            "parent": node["maParent"]
        }]
        for child in node.get("children", []):
            units.extend(flatten_tree(child))
        return units

    if tree_res and "data" in tree_res and tree_res["data"]:
        flat_units = flatten_tree(tree_res["data"])
        for u in flat_units:
            print(f"ID: {u['id']}")
            print(f"  Name: {u['name']}")
            print(f"  Type: {u['type']}")
            print(f"  Level: {u['level']}")
            print(f"  Parent: {u['parent']}")
    else:
        print("No union units found.")

    # 4. Get all members
    print("\n--- MEMBERS ---")
    status, members_res = api_call("/union-members", headers=headers)
    members = members_res["data"]["items"]
    for m in members:
        print(f"ID: {m['id']}")
        print(f"  HoTen: {m['hoTen']}")
        print(f"  CCCD: {m['soCCCD']}")
        print(f"  UnitId: {m['maToCongDoan']}")
        print(f"  UnitName: {m['tenToCongDoan']}")
        print(f"  Status: {m['trangThai']}")
        print(f"  Party: {m['dangVien']}")

    # 5. Fetch stats for each CDBP manager account to see what they return
    print("\n--- TEST STATS FOR SCOPED ACCOUNTS ---")
    for acc in accounts:
        if acc["vaiTro"] in ["CDBP", "TOCD"]:
            print(f"\nTesting stats for {acc['username']} (Org: {acc['hoTen']})...")
            st, login_res = api_call("/auth/login", method="POST", data={
                "username": acc["username"],
                "password": acc["passwordRaw"]
            })
            if st != 200:
                print(f"  Login failed for {acc['username']}: {login_res}")
                continue
            
            sc_token = login_res["data"]["token"]
            sc_headers = {"Authorization": f"Bearer {sc_token}"}
            
            st_stats, stats_res = api_call("/union-units/stats", headers=sc_headers)
            print("  Stats Response status:", st_stats)
            if st_stats == 200:
                s_data = stats_res["data"]
                print(f"  tongDoanVien: {s_data['tongDoanVien']}")
                print(f"  doanVienNam: {s_data['doanVienNam']}")
                print(f"  doanVienNu: {s_data['doanVienNu']}")
                print(f"  doanVienDangVien: {s_data['doanVienDangVien']}")
                print(f"  doanVienTheoCdbp: {s_data['doanVienTheoCdbp']}")
                print(f"  doanVienTheoToCd: {s_data['doanVienTheoToCd']}")

if __name__ == "__main__":
    inspect_db()
