

import SideBar from "./ui/sidebar"
import { useEffect, useState } from "react";
import { useRouter } from "next/router"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import VzeroPage from "./v0/page";

export default function Page() {

  return (
    <div>
      <VzeroPage />
    </div>
  );
}